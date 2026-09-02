/**
 * 并行运行队列
 * @param tasks 任务列表
 * @param queueLimit 限制最大并行运行队列数量
 * @returns
 */
export async function runTasks<T>(tasks: (() => Promise<T>)[], queueLimit: number): Promise<T[]> {
  const results: any[] = [];
  function* TaskGenerator(tasks: (() => Promise<any>)[]) {
    for (const task of tasks) {
      yield task;
    }
    return true;
  }

  const taskGenerator = TaskGenerator(tasks);

  const run = async () => {
    const task = taskGenerator.next();
    if (task.done) {
      return;
    }
    try {
      results.push(await task.value());
    } catch (err) {
      console.log(err);
      results.push(null);
    } finally {
      await run();
    }
  };

  const startTasks = [];
  for (let i = 0; i < Math.min(queueLimit, tasks.length); i++) {
    startTasks.push(run());
  }
  await Promise.all(startTasks);
  return results;
}
