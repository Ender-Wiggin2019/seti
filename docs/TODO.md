# TODO

- [x] 梳理真实 game、`debug/solar`、`debug/solar-system` 的 solar system 数据投影与渲染路径
- [x] 找到 image mode/text mode 旋转后可能分叉的具体代码点
- [x] 先写一个旧实现会失败的聚焦回归测试
- [x] 做最小修复并跑相关测试
- [x] 记录验证结果和剩余风险

## Review

- 根因：真实 game 从 snapshot 反序列化后丢失 solar-system wheel `layers`；后续旋转只更新 disc angle/occupants，元素层不再随轮盘移动，导致 image mode 的轮盘图片和 text/public state 偶发不同步。debug 新建内存路径保留 layers，所以表现正常。
- 修复：snapshot DTO/serializer/deserializer 将 `layers` 作为必需字段保存并恢复；不再提供缺失 `layers` 的旧 snapshot 兼容路径。
- 验证通过：`pnpm --filter @seti/server test -- GameDeserializer.test.ts`、`pnpm --filter @seti/server test -- GameSerializer.test.ts`、`pnpm --filter @seti/server typecheck`、`pnpm --dir packages/server exec biome check src/persistence/serializer/GameDeserializer.ts src/persistence/serializer/GameSerializer.ts src/persistence/dto/GameStateDto.ts __tests__/persistence/serializer/GameDeserializer.test.ts`。
- 剩余风险：不考虑旧 snapshot 兼容时，当前 snapshot 协议路径未发现剩余风险；真实 game reload 后保留完整 layer stack，后续 rotate 与内存新建 game 使用同一套数据模型。
