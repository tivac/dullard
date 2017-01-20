# Changes

## 2.0.1

- fix: merge order needs to handle includes first (#110)
- chore: update deps, replace istanbul w/ nyc

## 2.0.0

- fix: Correct merge order precedence (#109)

## 1.1.1

- fix: correct merge order for included config files (#107) (Kevin Cameron)

## 1.1.0

- Task start log now info level

## 1.0.1

- Clean up dependencies, oops. :construction:

## 1.0.0

- Add -s|--silly for easier debugging
- loglevel shortcuts should be booleans
- Add --test command to see steps that would've run

## 1.0.0-beta2

- Stop assigning argv._ to default, breaks things

## 1.0.0-beta1

- Remove errant debugger
- Test alternate includes use-case
- Add support for `includes` config option

## 0.4.5

- Don't show tasks as complete if they failed

## 0.4.4

- Handle util.format()-style strings in task done()

## 0.4.3

- Add --version arg & implementation

## 0.4.2

- Show correct log prefix for step summary message

## 0.4.1

- Add explicit test case for #30

## 0.4.0

- Update README.md

## 0.3.6

- Support npmlog formatting strings in log() calls
- Logging within a task documentation

## 0.3.5

- Return exit code 1 on error instead of lying

## 0.3.4

- Better checking before using `in` operator on (fixes #18)

## 0.3.3

- Track current task & use it for log events

## 0.3.2

- Fix NPM binary handling

## 0.3.0

- Logging clean up
- Switching to npm log

## 0.2.2

- Updated .gitignore
- Adding .npmignore

## 0.2.1

- Real basic Q&A section
- Support passing a single string task to .run()

## 0.2.0

- Change how CLI treats args
- Refactor core to support step collections

## 0.1.4

- Change config name to .dullfile

## 0.1.3

- Add "--list" CLI arg for showing available tasks
- Update task specimens to run faster

## 0.1.2

- Only load .js files in each specified dir
- Fix missing console output, v0.1.1

## 0.1.0

- More functional
- Change _build.js* to dullfile.js*

## 0.10

- Initial release
