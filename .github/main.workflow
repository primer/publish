workflow "lint, test, publish" {
  on = "push"
  resolves = [
    "lint",
    "test",
    "publish",
  ]
}

action "install" {
  uses = "actions/npm@master"
  args = "install"
}

action "lint" {
  uses = "actions/npm@master"
  args = "run lint"
}

action "test" {
  uses = "actions/npm@master"
  args = "test"
}

action "publish" {
  uses = "./"
  args = "--dry-run"
  secrets = ["GITHUB_TOKEN"]
}
