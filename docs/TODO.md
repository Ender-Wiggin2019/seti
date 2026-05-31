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

## Oumuamua Solar System Follow-up

- [x] 补充 debug rotate 回归：Oumuamua tile metadata 与 solar-system planet location 同步
- [x] 修复 debug rotate endpoint，让 Oumuamua tile/sector 随 alien rotation hook 更新
- [x] 让 `/debug/solar-system` 明确呈现 Oumuamua 的当前 space/sector
- [x] 跑相关 client/server 测试和类型检查

## Oumuamua Solar System Review

- 根因：`/debug/solar-system` 的 direct rotate endpoint 只旋转 `SolarSystem`，没有触发 `alienState.onSolarSystemRotated(game)`；Oumuamua 的 planet element 会随 wheel layer 移动，但 alien board 上缓存的 `tile.spaceId` / `sectorId` 没有同步，导致 sector data list 和 image overlay 锚在旧位置。
- 修复：debug `solarRotate` / `solarRotateNext` 旋转后调用同一套 alien rotation hook；debug 页面新增 Oumuamua 当前 `spaceId / sectorId` readout，便于验证 reveal 后的位置。
- 验证通过：`pnpm --filter @seti/server test -- debug.service.test.ts`、`pnpm --filter @seti/client test -- SolarSystemCompareDebugPage.test.tsx`、`pnpm --filter @seti/server typecheck`、`pnpm --filter @seti/client typecheck`、`pnpm exec biome check ...`。
