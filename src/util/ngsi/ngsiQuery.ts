import { IndexingContext, Context } from "./ngsiContext";

class Range {
    public readonly min: number;
    public readonly max: number;

    constructor(op1: number, op2: number) {
        this.min = Math.min(op1, op2);
        this.max = Math.max(op1, op2);
    }
}

export class NgsiQuery {
    private static readonly operators = {
        '|': 1,
        ';': 2,
        '==': 3,
        '!=': 3,
        '>': 3,
        '>=': 3,
        '<': 3,
        '<=': 3,
        '~=': 3,
        '!~=': 3,
        ',': 4,
        '..': 5,
        '(': -1
    };
    private static readonly SyntaxSplitRegExp = new RegExp('"(.*?)"|(\\(|\\)|,|==|!=|>(?!=)|>=|<(?!=)|<=|~=|!~=|\\.\\.|;|\\||\'.*?\')');
    private static readonly AttributeSplitRegExp = new RegExp('\\.|(\\[)|((?<=\\[).*?(?=\\]))|\\]|(\\b[a-z]+?:\\/\\/.*?\\/.*?(?=[\\.\\[]|$))');
    private static readonly ExpandedAttrRegExp = new RegExp('^\\b[a-z]+?:\\/\\/.*?/.*$');
    private static readonly EscapeAttrRegExp = new RegExp('\\.', 'g');

    public readonly query: unknown;

    constructor(query: string, context: Context) {
        const queryGroups = NgsiQuery.parseQuery(query);
        const mongoQuery = NgsiQuery.constructMongoQuery(queryGroups);
        this.query = NgsiQuery.resolveContext(mongoQuery, context);
    }

    // Parse query into Reverse Polish notation using Shunting-yard algorithm
    private static parseQuery(query: string): (string | number | boolean)[] {
        const queryGroups: (string | number | boolean)[] = [];
        const operatorStack: (keyof typeof NgsiQuery.operators)[] = [];

        const tokens = query.split(NgsiQuery.SyntaxSplitRegExp).filter(x => x && x !== '');

        for (const token of tokens) {
            // If token is an operator
            switch (token) {
                case '==':
                case '!=':
                case '>':
                case '>=':
                case '<':
                case '<=':
                case ',':
                case '..':
                case ';':
                case '|': {
                    const precedence = NgsiQuery.operators[token];

                    // Add all operators with greater or equal precedence to the output queue
                    let op: string;
                    while (operatorStack.length > 0 && NgsiQuery.operators[(op = operatorStack[operatorStack.length - 1])] >= precedence) {
                        queryGroups.push(op);
                        operatorStack.pop();
                    }

                    operatorStack.push(token);

                    break;
                }
                case '(':
                    operatorStack.push(token);
                    break;
                case ')': {
                    // Add all operators within parentheses to the output queue
                    let op: string;
                    while (operatorStack.length > 0 && (op = operatorStack[operatorStack.length - 1]) !== '(') {
                        queryGroups.push(op);
                        operatorStack.pop();
                    }

                    if (operatorStack.length === 0) {
                        const msg = `Parsing Error: mismatched paretheses (too many closing parentheses)`;
                        console.error(msg);
                        throw new Error(msg);
                    }

                    operatorStack.pop();
                    break;
                }
                case '~=':
                case '!~=':
                    throw new Error('RegExp queries not supported');
                default: {// if token is part of expression
                    const exprNumber = parseFloat(token);
                    queryGroups.push(isNaN(exprNumber) ? (token === 'true' ? true : token === 'false' ? false : token) : exprNumber);
                }
            }
        }

        while (operatorStack.length > 0) {
            const op = operatorStack.pop()!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
            if (op === '(') {
                const msg = `Parsing Error: mismatched paretheses (missing closing parenthesis)`;
                console.error(msg);
                throw new Error(msg);
            }

            queryGroups.push(op);
        }

        return queryGroups;
    }

    // Construct MongoDB query object by traversing Reverse Polish representation of a query
    private static constructMongoQuery(query: (string | number | boolean)[]): unknown {
        const exprStack: unknown[] = [];

        for (const token of query) {
            if (token in NgsiQuery.operators) {
                if (exprStack.length < 2) {
                    const msg = `Parsing Error: operator='${token}' does not have sufficient operands`;
                    console.error(msg);
                    throw new Error(msg);
                }

                const op2 = exprStack.pop()!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                const op1 = exprStack.pop()!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

                // Validate the operands of camparison operators
                if (['==', '!=', '>', '>=', '<', '<='].find(t => t === token)) {
                    if (typeof op1 !== 'string') {
                        const msg = `Parsing Error: invalid attribute name for op='${token}'`;
                        console.error(msg);
                        throw new Error(msg);
                    }

                    if (['>', '>=', '<', '<='].find(t => t === token)) {
                        if (typeof op2 !== 'string' && typeof op2 !== 'number') {
                            const msg = `Parsing Error: comparison operator op='${token}' can only be used with strings and numbers`;
                            console.error(msg);
                            throw new Error(msg);
                        }
                    } else { // ==, !=
                        if (typeof op2 === 'object' && !(op2 instanceof Array || op2 instanceof Range)) {
                            const msg = `Parsing Error: equality operator op='${token}' can only be used with Range or ValueList or simle types`;
                            console.error(msg);
                            throw new Error(msg);
                        }
                    }
                }

                switch (token) {
                    case '==':
                        if (op2 instanceof Array) {
                            exprStack.push({ [op1 as string]: { $in: op2 } });
                        } else if (op2 instanceof Range) {
                            exprStack.push({
                                $and: [
                                    { [op1 as string]: { $gte: op2 } },
                                    { [op1 as string]: { $lte: op2 } }
                                ]
                            });
                        } else { // op2 is a value
                            exprStack.push({ [op1 as string]: { $eq: op2 } });
                        }

                        break;
                    case '!=':
                        if (op2 instanceof Array) {
                            exprStack.push({ [op1 as string]: { $nin: op2 } });
                        } else if (op2 instanceof Range) {
                            exprStack.push({
                                $nor: [
                                    { [op1 as string]: { $gte: op2 } },
                                    { [op1 as string]: { $lte: op2 } }
                                ]
                            });
                        } else { // op2 is a value
                            exprStack.push({ [op1 as string]: { $ne: op2 } });
                        }
                        break;
                    case '>':
                        exprStack.push({ [op1 as string]: { $gt: op2 } });
                        break;
                    case '>=':
                        exprStack.push({ [op1 as string]: { $gte: op2 } });
                        break;
                    case '<':
                        exprStack.push({ [op1 as string]: { $lt: op2 } });
                        break;
                    case '<=':
                        exprStack.push({ [op1 as string]: { $lte: op2 } });
                        break;
                    case ',': {
                        // ValueList can only consists of simple types
                        if (!((typeof op1 === 'string' || typeof op1 === 'number' ||
                            (op1 instanceof Array && (typeof op1[0] === 'string' || (typeof op1[0] === 'number')))) &&
                            (typeof op2 === 'string' || typeof op2 === 'number' ||
                                (op2 instanceof Array && (typeof op2[0] === 'string' || (typeof op2[0] === 'number')))))) {
                            const msg = `Parsing Error: invalid ValueList operand`;
                            console.error(msg);
                            throw new Error(msg);
                        }
                        exprStack.push(([] as unknown[]).concat(op1, op2));
                        break;
                    }
                    case '..':
                        if (typeof op1 !== 'number' || typeof op2 !== 'number') {
                            const msg = `Parsing Error: invalid Range operand`;
                            console.error(msg);
                            throw new Error(msg);
                        }
                        exprStack.push(new Range(op1, op2));
                        break;
                    case ';': {
                        if (typeof op1 === 'number' || typeof op2 === 'number' ||
                            op1 instanceof Range || op2 instanceof Range ||
                            op1 instanceof Array || op2 instanceof Array) {
                            const msg = `Parsing Error: invalid operand for AND operator`;
                            console.error(msg);
                            throw new Error(msg);
                        }

                        // Create EXISTS query if expression consists only of attribute name
                        const expr1 = typeof op1 === 'string' ? { [op1]: { $exists: true } } : op1;
                        const expr2 = typeof op2 === 'string' ? { [op2]: { $exists: true } } : op2;

                        // Create an AND query object and unwrap exisitng AND operands to prevent nesting
                        const exprResult = {
                            $and: ([] as unknown[]).concat(
                                '$and' in (expr1 as object) ? (expr1 as { $and: unknown[] }).$and : expr1,
                                '$and' in (expr2 as object) ? (expr2 as { $and: unknown[] }).$and : expr2
                            )
                        };

                        exprStack.push(exprResult);

                        break;
                    }
                    case '|': {
                        if (typeof op1 === 'number' || typeof op2 === 'number' ||
                            op1 instanceof Range || op2 instanceof Range ||
                            op1 instanceof Array || op2 instanceof Array) {
                            const msg = `Parsing Error: invalid operand for OR operator`;
                            console.error(msg);
                            throw new Error(msg);
                        }

                        // Create EXISTS query if expression consists only of attribute name
                        const expr1 = typeof op1 === 'string' ? { [op1]: { $exists: true } } : op1;
                        const expr2 = typeof op2 === 'string' ? { [op2]: { $exists: true } } : op2;

                        // Create an OR query object and unwrap exisitng OR operands to prevent nesting
                        const exprResult = {
                            $or: ([] as unknown[]).concat(
                                '$or' in (expr1 as object) ? (expr1 as { $or: unknown[] }).$or : expr1,
                                '$or' in (expr2 as object) ? (expr2 as { $or: unknown[] }).$or : expr2
                            )
                        };

                        exprStack.push(exprResult);
                        break;
                    }
                    default:
                        throw new Error(`Operator '${token}' is not supported`);
                }
            } else {
                exprStack.push(token);
            }
        }

        if (exprStack.length !== 1) {
            const msg = `Parsing Error: query contains ${exprStack.length} expressions. Expected a single expression.`;
            console.error(msg);
            throw new Error(msg);
        }

        return typeof exprStack[0] === 'string' ? { [exprStack[0]]: { $exists: true } } : exprStack[0];
    }

    // Use @context to convert property names to ones used to store indexed data
    private static resolveContext(query: unknown, context: Context): unknown {
        if ('$or' in (query as object)) {
            return {
                $or: (query as { $or: unknown[] }).$or.map(expr => NgsiQuery.resolveContext(expr, context))
            }
        } else if ('$and' in (query as object)) {
            return {
                $and: (query as { $and: unknown[] }).$and.map(expr => NgsiQuery.resolveContext(expr, context))
            }
        } else {
            const result: { [attr: string]: unknown } = {};
            const normalizedAttr: { attr: string; expr: unknown }[] = [];
            for (const attr in (query as { [attr: string]: unknown })) {
                const expr = (query as { [attr: string]: unknown })[attr];

                const resolvedTokens: string[] = [];
                const tokens = attr.split(NgsiQuery.AttributeSplitRegExp).filter(x => x && x !== '');
                for (let i = 0; i < tokens.length; i++) {
                    let token = tokens[i];

                    if (token === '[') {
                        if (tokens.length !== i + 2) {
                            const msg = `Parsing Error: invalid attribute '${attr}'. Trailing path must the last section of attribute name`;
                            console.error(msg);
                            throw new Error(msg);
                        }

                        resolvedTokens.push('value');
                        continue;
                    }

                    // If token is a short property name, expand it to full URL using query context
                    if (!NgsiQuery.ExpandedAttrRegExp.test(token)) {
                        token = Object.keys(context.expand({ [token]: '' }))[0];
                    }

                    // Compact the full property URL using internal indexing context
                    // or encode all dot characters if property is still a full URL
                    const resolvedToken = Object.keys(IndexingContext.compact({ [token]: '' }))[0].replace(NgsiQuery.EscapeAttrRegExp, '%2E');

                    resolvedTokens.push(resolvedToken);
                }

                // If last token is a URL, it is stored in index in normalizer NGSI-LD form, hence need to modify expression
                const attrName = resolvedTokens.join('.');
                if (NgsiQuery.ExpandedAttrRegExp.test(resolvedTokens[resolvedTokens.length - 1])) {
                    normalizedAttr.push({
                        attr: attrName,
                        expr: expr
                    });
                } else {
                    result[attrName] = expr;
                }
            }

            // Normalized attributes can be either Property or Relationship
            if (normalizedAttr.length > 0) {
                return {
                    $and: [
                        ...normalizedAttr.map(x => ({
                            $or: [
                                { [`${x.attr}.value`]: x.expr },
                                { [`${x.attr}.object`]: x.expr }
                            ]
                        })),
                        result
                    ]
                }
            }

            return result;
        }
    }
}