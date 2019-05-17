workflow "lint, test, publish" {
  on = "push"
  resolves = [
    "lint",
    "test",
    "publish to npm",
    "publish to gpr"
  ]
}

action "install" {
  uses = "actions/npm@master"
  args = "ci"
}

action "lint" {
  needs = "install"
  uses = "actions/npm@master"
  args = "run lint"
}

action "test" {
  needs = "install"
  uses = "actions/npm@master"
  args = "test"
}

action "publish to npm" {
  needs = ["lint", "test"]
  uses = "./"
  secrets = [
    "GITHUB_TOKEN",
    "NPM_AUTH_TOKEN",
  ]
}

action "publish to gpr" {
  uses = "./"
  needs = ["install", "publish to npm"]
  secrets = [
    "GITHUB_TOKEN",
    "GPR_AUTH_TOKEN",
  ]
  args = ["--", "--unsafe-perm", "--allow-same-version"]
  env = {
    NPM_REGISTRY_URL = "npm.pkg.github.com"
  }
}