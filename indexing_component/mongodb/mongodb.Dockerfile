# Container to generate keyfile
FROM alpine:latest as keyGenerator

WORKDIR /usr/src/app

## Install OpenSSH
RUN apk add --no-cache openssl

## Generate the keyfile
RUN openssl rand -base64 756 > keyfile
# ----------------


# Main mongodb container
FROM mongo

COPY --chown=mongodb:mongodb --from=keyGenerator /usr/src/app/keyfile /security/
RUN chmod 400 /security/keyfile

RUN echo 'Europe/London' > /etc/localtime
RUN chmod 444 /etc/localtime
# ----------------