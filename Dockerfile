FROM node:10-slim

LABEL com.github.actions.name="Primer publish"
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="blue"

LABEL version="0.1.0"
LABEL repository="http://github.com/primer/actions"
LABEL homepage="http://github.com/primer/actions/tree/master/deploy"
LABEL maintainer="GitHub Design Systems <design-systems@github.com>"

RUN apt-get update && \
  apt-get install -y --no-install-recommends git

COPY . /primer-publish
RUN npm install --production

ENTRYPOINT ["/primer-publish/entrypoint.sh"]
