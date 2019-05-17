#!/bin/bash
set -e

AUTH="${GPR_AUTH_TOKEN:=$NPM_AUTH_TOKEN}"

if [ -z "$AUTH" ]; then
  # Respect NPM_CONFIG_USERCONFIG if it is provided, default to $HOME/.npmrc
  NPM_CONFIG_USERCONFIG="${NPM_CONFIG_USERCONFIG-"$HOME/.npmrc"}"
  NPM_REGISTRY_URL="${NPM_REGISTRY_URL-registry.npmjs.org}"
  NPM_REGISTRY_SCHEME="http"

  # Allow registry.npmjs.org to be overridden with an environment variable
  printf "//%s/:_authToken=%s\\nregistry=%s" "$NPM_REGISTRY_URL" "$AUTH" "${NPM_REGISTRY_SCHEME}://$NPM_REGISTRY_URL" > "$NPM_CONFIG_USERCONFIG"
  chmod 0600 "$NPM_CONFIG_USERCONFIG"
fi

# configure git with sensible defaults
git config --global user.email "${GIT_USER_EMAIL:-$(jq -r .pusher.email $GITHUB_EVENT_PATH)}"
git config --global user.name "${GIT_USER_NAME:-$(jq -r .pusher.name $GITHUB_EVENT_PATH)}"
# then print out our config
git config --list

sh -c "/primer-publish/cli.js $*"
