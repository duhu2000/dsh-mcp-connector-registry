# 克而瑞·深度智联地产数据：有限连接验收与上架批准

批准日期：2026-11-15；审核人：DuHu；范围：connection-only。

用户明确批准“按有限验证状态上架，署名 DuHu”。卡片 published=true、featured=false、probeStatus=partial。
业务 runtimeAcceptance 保持 not-run，原候选评分保持不变。正式卡片展示“业务查询尚未验收”。
本轮没有执行 tools/call、没有消耗业务查询额度，没有读取或保存凭据。

## 连接证据

- 连接与工具发现时间：2026-11-14T14:05:45Z；工具数：2。
- 本机预检原始脱敏记录：[预检](../../../candidates/drafts/workbuddy-data-2026-11-14/evidence/cric-dsh-connection-preflight.md)。
- 上架及服务使用边界：[审核记录](../../review-batches/workbuddy-limited-2026-11-15.md)。
- 用户于 2026-11-15 再次确认这两项已经可以连通；没有将该反馈虚构为新的业务调用或重新探测时间。

## 未验收范围

未验证业务数据返回、实际扣费、套餐权限、长期稳定性或大陆直连；各服务最多 1 积分、1 次的测试预算继续有效。
OpenBoost 匿名也能列出工具，不能由工具发现证明 Key 的业务权限；克而瑞长请求兼容性仍待业务测试。
OpenBoost 下单工具的独立禁用未验证，卡片提示不等于 Host 层权限隔离；不授权下单、购买或支付。

仅连接验收不伪装为业务验收通过。后续完整验收需追加实际只读 tools/call 证据和具名复核，再取消有限范围标识。
