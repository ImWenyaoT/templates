export type SummaryLength = "brief" | "short" | "detailed";

export type MockSummary = {
  id: string;
  title: string;
  url: string;
  source: string;
  excerpt: string;
  articleHash: string;
  createdAt: string;
  readingTimeMinutes: number;
  summaries: Record<SummaryLength, string>;
  highlights: string[];
};

export const summaryTabs: Array<{
  id: SummaryLength;
  label: string;
  helper: string;
}> = [
  {
    id: "brief",
    label: "一句话",
    helper: "适合先判断是否值得继续阅读。",
  },
  {
    id: "short",
    label: "短摘要",
    helper: "保留文章核心事实和结论。",
  },
  {
    id: "detailed",
    label: "详细摘要",
    helper: "覆盖背景、论证和可行动信息。",
  },
];

export const mockSummaries: MockSummary[] = [
  {
    id: "sum_20260607_001",
    title: "AI Agents Are Becoming Everyday Research Assistants",
    url: "https://example.com/research/ai-agents-everyday-assistants",
    source: "Example Research",
    excerpt:
      "A practical look at how agentic tools are moving from demos into repeatable research workflows.",
    articleHash: "art_8f94c1",
    createdAt: "2026-06-07T08:42:00+08:00",
    readingTimeMinutes: 9,
    summaries: {
      brief:
        "文章认为 AI agents 的价值正在从炫技式演示转向可复用的研究流程，关键在于边界清晰、可验证和人类审阅。",
      short:
        "作者指出，AI agents 逐渐承担资料检索、初步归纳、交叉验证和草稿整理等日常研究工作。文章强调，真正可靠的 agent 工作流不是完全自动化，而是把任务拆成可检查的步骤，并在引用、来源质量和失败恢复上保留人工把关。",
      detailed:
        "这篇文章讨论 AI agents 如何进入日常研究流程。它先区分了演示场景和真实工作场景：前者追求一次性惊艳，后者更看重稳定输出、来源可追踪和错误可恢复。作者随后提出三条实践原则：第一，把任务拆成检索、筛选、总结、复核等阶段；第二，对关键结论保留引用和反证检查；第三，让人类负责判断研究目标是否已经变化。文章结论是，agents 更像研究助理，而不是替代研究者的完整系统。",
    },
    highlights: [
      "把任务拆成可审阅步骤，比端到端自动化更可靠。",
      "引用质量和失败恢复决定真实研究场景中的可用性。",
      "人类仍需要负责目标判断和最终取舍。",
    ],
  },
  {
    id: "sum_20260606_003",
    title: "What Static Article Extraction Still Gets Wrong",
    url: "https://example.com/web/static-article-extraction",
    source: "Web Systems Notes",
    excerpt:
      "Static HTML parsing is fast and deployable, but paywalls, dynamic rendering, and noisy markup still complicate extraction.",
    articleHash: "art_31bd77",
    createdAt: "2026-06-06T21:16:00+08:00",
    readingTimeMinutes: 6,
    summaries: {
      brief:
        "文章指出静态正文抽取依然会被动态渲染、噪声模板和访问限制影响，因此需要清晰的失败状态与可选 fallback。",
      short:
        "作者总结了静态文章抽取的常见问题：正文和导航混杂、标题重复、摘要缺失、JavaScript 渲染内容不可见，以及部分站点主动限制抓取。文章建议优先使用轻量 HTML 解析，但要在失败时提供清楚提示，并把浏览器渲染服务作为可选后备。",
      detailed:
        "文章围绕静态文章抽取的局限展开。静态解析速度快、成本低，也适合在 Serverless 环境中部署，但它无法执行 JavaScript，遇到客户端渲染文章、复杂广告模板或登录墙时容易失败。作者建议系统应设置超时、重定向上限、响应体大小限制和 User-Agent，并在抽取结果置信度低时停止生成摘要。结论是，静态抽取应作为默认路径，动态渲染服务只作为明确配置的 fallback。",
    },
    highlights: [
      "静态解析适合作为默认路径。",
      "低置信度抽取不应继续生成摘要。",
      "动态渲染服务适合作为可选 fallback。",
    ],
  },
  {
    id: "sum_20260605_002",
    title: "Designing Summary Length Controls for Busy Readers",
    url: "https://example.com/product/summary-length-controls",
    source: "Product Patterns",
    excerpt:
      "A small interaction pattern for helping users move from quick gist to detailed reading without losing context.",
    articleHash: "art_b620aa",
    createdAt: "2026-06-05T17:08:00+08:00",
    readingTimeMinutes: 4,
    summaries: {
      brief:
        "文章建议把摘要长度设计成同一结果的视图切换，而不是三份割裂内容，以减少用户切换成本。",
      short:
        "作者认为，摘要产品常见的问题是把不同长度的摘要放成三张独立卡片，导致用户很难比较信息密度。更好的做法是用 tabs 或 segmented control，让用户从一句话快速进入短摘要或详细摘要，同时保留标题、来源和关键元信息。",
      detailed:
        "文章从忙碌读者的阅读路径出发，提出摘要长度控件应支持渐进式深入。用户通常先看一句话判断文章价值，再进入短摘要确认关键事实，最后才阅读详细摘要。因此界面不应同时铺开三块长文本，而应把它们作为同一个结果的三个层级。作者还建议在摘要旁展示来源、时间、阅读时长和关键要点，帮助用户快速建立信任。",
    },
    highlights: [
      "摘要长度应是视图切换，而不是三份割裂卡片。",
      "元信息可以帮助用户建立信任。",
      "渐进式深入比一次展示全部内容更适合忙碌读者。",
    ],
  },
];

/**
 * Returns summaries ordered from newest to oldest for list-oriented UI.
 */
export function getSummariesByNewest(): MockSummary[] {
  return [...mockSummaries].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );
}

/**
 * Finds a single mock summary by its stable identifier for static result pages.
 */
export function getSummaryById(id: string): MockSummary | null {
  return mockSummaries.find((summary) => summary.id === id) ?? null;
}

/**
 * Formats an ISO timestamp for compact user-facing history metadata.
 */
export function formatSummaryDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
