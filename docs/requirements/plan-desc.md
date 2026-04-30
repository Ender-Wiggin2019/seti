阅读 @docs/arch/arch-client.md @docs/arch/arch-server.md @docs/arch/prd-rule.md ，接下来为我生成一份 plan，规划整个项目的任务拆分。要求是：

拆分成独立的可执行单元，明确任务是串行还是并行。不同并行任务可以解耦并行实现。最终目录结构是：

plan文件夹
summary.md: todo list 总览，只包含任务名和状态

stages -> task 的目录结构。

stages 是每个迭代，类似里程碑。
task 是独立子任务，可以包含多个小的任务点，但是每个文件需要是独立的，比如如果内部是串行任务，可以一次全部执行了。
包含任务的title, 描述，和大致功能说明。以及技术实现方案。

注意，对于每个任务，都需要单测，对于前端，关注一下能不能实现e2e的测试。
