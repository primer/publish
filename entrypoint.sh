#!/bin/bash
set -e
git config --global user.email "${GIT_USER_EMAIL:-design-systems@github.com}"
git config --global user.name "${GIT_USER_NAME:-primer-bot}"
sh -c "/primer-publish/cli.js $*"
