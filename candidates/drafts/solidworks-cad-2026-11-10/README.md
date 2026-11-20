# SolidWorks CAD（solidworks-cad）上架准备与验收记录

状态：**待维护者来源审核 + 独立运行时验收 + 人工批准**。本目录为贡献者提交的候选草案，
`review.decision` 保持 `pending`，不参与 catalog 构建，不代表已批准或已上架。

对应 PR：#61；维护者 review（CHANGES_REQUESTED）：
<https://github.com/duhu2000/dsh-mcp-connector-registry/pull/61#pullrequestreview-5843057988>。

## 固定来源与版本

- 仓库：<https://github.com/wangruiyu070802/solidworks-mcp>（MIT）。
- 固定版本：git tag **`v0.2.0`** = commit
  `20a1c75eb695830c94d301b249b4cfe6d2549bd5`。
- 启动命令（描述符 `args`）：`uvx --from https://github.com/wangruiyu070802/solidworks-mcp@v0.2.0 solidworks-mcp`。
- 许可证：本插件 MIT（`LICENSE`）。**SOLIDWORKS 是 Dassault Systèmes 商业软件，需要用户自有有效许可；Bambu Studio 是独立第三方应用，遵循其自身许可。**「免费」仅指本插件 MIT 授权。

## 平台前置条件

- Windows 10/11 x64；本机安装并已授权 SOLIDWORKS（贡献者环境：2024 SP0.1，COM revision 32.0.1）。
- Python ≥ 3.10（`uvx` 自动提供）。
- （可选）Bambu Studio（贡献者环境 02.09.01.70），仅用于打开模型人工切片。
- 安装过程需要联网下载依赖；运行阶段只在本机操作，不上传模型。

## 针对 review 6 项阻塞的修复（tag v0.2.0）

1. **文档所有权 / 未保存工作**：`_close_all`（关闭所有文档）已替换为 `_close_owned`，只关闭
   本服务通过标题跟踪的自建文档；新增 `_track_owned` / `_is_owned` / `_new_doc`。`_rebuild*`
   不再枚举关闭无关文档。自测（selftest）说明改为「只新建/关闭本服务自建临时文档」，不再标注为「非破坏性」。
2. **输出路径 / 覆盖安全**：`sw_save_part` / `sw_export_stl` / `sw_export_3mf` 新增 `overwrite` 参数，
   默认 `false`（已存在即拒绝）；`_resolve_output_path` 把输出限定在输出目录内（设
   `SOLIDWORKS_ALLOW_EXTERNAL_OUTPUT=1` 才允许越界）；`_atomic_export` 先写临时文件、校验非空后
   `os.replace` 原子替换，失败不破坏原文件。
3. **活动文档隔离**：`_ensure_doc` 只在活动文档标题匹配本服务所有权（进程内 `_owned_titles` 或持久化
   `owned_title`）时才复用，否则重建自建文档——不再静默保存/导出无关活动零件。
4. **能力与副作用表述**：`sw_check_printability` 及打印检查文案从「硬护栏」改为「建议（非强制，PASS 非制造安全保证）」；
   新增非有限/非正/超范围尺寸与孔位几何校验；工具注解（readOnly/destructive/openWorld hint）已补齐，
   并在 description 披露状态/日志写入、文档替换、文件覆盖风险、GUI 拉起、COM 可能启动 SOLIDWORKS 等副作用。
5. **可复现安装与许可**：描述符从移动 git URL 固定为 `@v0.2.0`；README 区分 MIT / SOLIDWORKS / Bambu 许可，
   并限定「免费/网络」表述。
6. **候选与验收记录**：本目录即候选草案；以下记录工具/注解、disposable 流程与证据，等待维护者批准。

## 发现工具与注解（11 个）

| 工具 | readOnlyHint | destructiveHint | 说明 |
|------|:---:|:---:|------|
| `sw_status` | false | false | 只读查询，但可能经 COM 启动 SOLIDWORKS |
| `sw_plate` | false | true | 重建并替换本服务自建模型，写状态文件 |
| `sw_hole` | false | true | 重建模型 |
| `sw_holes_clear` | false | true | 重建模型 |
| `sw_check_printability` | true | — | 纯状态读取，不连 SOLIDWORKS、不写文件 |
| `sw_phone_stand` | false | true | 重建模型 |
| `sw_part` | false | true | 重建模型 |
| `sw_save_part` | false | true | 写 .SLDPRT，默认不覆盖 |
| `sw_export_stl` | false | true | 写 .STL，默认不覆盖 |
| `sw_export_3mf` | false | true | 写 .3mf，默认不覆盖 |
| `sw_open_in_bambu` | false | false | 拉起 Bambu Studio GUI |

## 纯函数回归（可复现，无需 SOLIDWORKS）

`python -m unittest discover -s tests -v` → **27 项全部通过**，覆盖新增安全边界：

- 覆盖拒绝：已存在文件 + `overwrite=false` 抛 `FileExistsError` 且原文件字节不变。
- 越界路径：输出目录外路径被拒，`SOLIDWORKS_ALLOW_EXTERNAL_OUTPUT=1` 才放行。
- 写失败保留：writer 抛错时原子导出不破坏原文件、无残留临时文件。
- 所有权匹配：`_is_owned` 按进程内标题与持久化 `owned_title` 判定，无关标题返回 False。
- 输入校验：NaN/Inf/非数值/非正/超范围一律拒绝。
- 原子覆盖：`overwrite=true` 时用临时文件原子替换。

## 集成自测（待真实 SOLIDWORKS 会话重跑）

`solidworks-mcp --selftest` 现已加入：① 创建一个「外来」文档，验证 `_close_owned` 不关闭它、
自建文档被关闭；② 覆盖拒绝失败路径。此自测**需真实 SOLIDWORKS，且会新建/关闭自建临时文档**，
本轮未在真实会话重跑。贡献者早先的 7/7 自测与 DSH 端到端结果是**修复前**的贡献者证据，
不构成独立验收。请维护者在无未保存工作的 SOLIDWORKS 会话中按以下 disposable 流程执行：

```powershell
uvx --from "https://github.com/wangruiyu070802/solidworks-mcp@v0.2.0" solidworks-mcp --selftest
```

验收要求（不预填通过）：

1. 记录时间戳、Windows/DSH/SOLIDWORKS 版本、Python 版本、调用命令（本机路径脱敏）。
2. 记录工具发现结果与注解（上表），与源码核对，不把全部工具标为只读。
3. 仅使用一次性自建文档与输出目录；不打开、不关闭、不保存任何真实 CAD 模型；不发起真实打印任务。
4. 记录产物格式（二进制 STL / SLDPRT / 3MF）、尺寸（如 60×40×5mm）、三角面数、字节数与 SHA-256。
5. 覆盖「外来文档不被关闭」「已存在文件默认拒绝覆盖」失败路径证据。
6. 不含私有 CAD 模型、用户名/本机私有路径、凭据或原始敏感日志。

## 剩余门禁

- 维护者来源审核（官方证据 / 许可证 / 鉴权 / 独立可验证性）。
- 独立 Windows + SOLIDWORKS 运行时验收（上述 disposable 流程）。
- 具名维护者人工批准后，将候选迁入 `candidates/records/` 并置 `review.decision=approved`。
- 最终精确 head CI 通过后再合并；合并后核验 main CI、catalog 重建与 CDN 一致，不把合并视为上线。
