import axios from "axios";

const TOKEN_KEY = "st_access";
const REFRESH_KEY = "st_refresh";

export const tokenStore = {
	get: () =>
		typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
	getRefresh: () =>
		typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null,
	set: (a: string, r: string) => {
		localStorage.setItem(TOKEN_KEY, a);
		localStorage.setItem(REFRESH_KEY, r);
	},
	clear: () => {
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(REFRESH_KEY);
	},
};

export const api = axios.create({ baseURL: "/api/v1", timeout: 30000 });

const isAuthPageRequest = (url?: string) =>
	typeof url === "string" &&
	(url.includes("/auth/login") || url.includes("/auth/register"));

api.interceptors.request.use((cfg) => {
	const t = tokenStore.get();
	if (t) cfg.headers.Authorization = `Bearer ${t}`;
	return cfg;
});

let refreshing = false;
api.interceptors.response.use(
	(res) => {
		const body = res.data;
		if (body && typeof body.code === "number" && body.code !== 0) {
			return Promise.reject(new Error(body.message || "请求失败"));
		}
		return body?.data !== undefined ? body.data : body;
	},
	async (err) => {
		const original = err.config;
		if (
			err.response?.status === 401 &&
			!original._retry &&
			tokenStore.getRefresh()
		) {
			original._retry = true;
			if (!refreshing) {
				refreshing = true;
				try {
					const r = await axios.post("/api/v1/auth/refresh", {
						refresh_token: tokenStore.getRefresh(),
					});
					tokenStore.set(r.data.data.access_token, r.data.data.refresh_token);
				} catch {
					tokenStore.clear();
					if (typeof window !== "undefined") window.location.href = "/login";
				} finally {
					refreshing = false;
				}
			}
			return api(original);
		}
		if (err.response?.status === 401 && !isAuthPageRequest(original?.url)) {
			tokenStore.clear();
			if (typeof window !== "undefined") window.location.href = "/login";
		}
		// 优先提取后端返回的真实 message，避免展示 HTTP 状态码
		const backendMsg: string | undefined = err.response?.data?.message;
		if (backendMsg) {
			return Promise.reject(new Error(backendMsg));
		}
		// 无后端 message 时按状态码给出用户可读文案
		const status = err.response?.status;
		const fallback: Record<number, string> = {
			400: "请求参数有误，请检查后重试",
			403: "没有权限执行该操作",
			404: "请求的资源不存在",
			409: "该账号已存在，请直接登录",
			422: "输入内容不符合要求，请检查后重试",
			429: "操作过于频繁，请稍候再试",
			500: "服务器暂时出现问题，请稍候重试",
		};
		if (status && fallback[status]) {
			return Promise.reject(new Error(fallback[status]));
		}
		if (status && status >= 500) {
			return Promise.reject(new Error("服务器暂时不可用，请稍候重试"));
		}
		return Promise.reject(new Error("网络请求失败，请检查网络连接"));
	},
);
