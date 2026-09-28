/** 探测 Agent 服务是否在线（支持自定义 host） */
export async function probeLocalAgent(
    port: number = DEFAULT_AGENT_PORT,
    host: string = '127.0.0.1'
): Promise<AgentProbeResult> {
    // 从用户设置的端口开始，依次向后探测（服务端口被占用会自动 +1）
    const attempts = Array.from({ length: PROBE_PORT_RANGE }, (_, i) => port + i).map(async (p) => {
        const baseUrl = `http://${host}:${p}`;
        try {
            const res = await agentFetch(baseUrl, '/status', { method: 'GET' }, 2500);
            if (!res.ok) return null;
            const status = (await res.json()) as AgentStatus;
            if (!status || status.service !== 'kgcfip-agent') return null;
            return { baseUrl, status };
        } catch {
            return null;
        }
    });

    const settled = await Promise.all(attempts);
    const hit = settled.find((x): x is { baseUrl: string; status: AgentStatus } => !!x);
    if (!hit) return { online: false, reason: 'offline' };

    return { online: true, baseUrl: hit.baseUrl, status: hit.status };
}
