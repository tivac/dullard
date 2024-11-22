// Attempts to read a task off disk
export default async function loadTask(tasks, name) {
    if (typeof name === "function") {
        return name;
    }

    if (!(name in tasks)) {
        return false;
    }

    // Task is already loaded
    if (typeof tasks[name] === "function") {
        return tasks[name];
    }

    // Unloaded task, require and attach source info
    const task = await import(new URL(`file://${tasks[name].source}`)).then((module) => {
        const js = module.default;

        js.source = tasks[name].source;

        return js;
    });

    // Save for re-use
    tasks[name] = task;

    return task;
}
