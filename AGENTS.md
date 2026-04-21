1. 项目是 monorepo 结构，包含前后端。所有可复用的逻辑，如数据结构等，都应该放到 common package
2. 涉及到游戏规则的实现，需要严格遵守 `docs/arch/rule-simple.md`, 这是比较简单的规则。如果有不明确的，可以再查看详细的 `docs/arch/rule-raw.md`
3. 功能增加和改动，需要先仔细定位会改动到哪个包。如果同时涉及client和server的改动，需要同步修改，不要让两端不一致。