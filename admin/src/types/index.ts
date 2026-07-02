export interface UserMe {
	id: string;
	username: string;
	nickname?: string;
	avatar_url?: string;
	role: "superadmin" | "user";
	status: string;
}
export interface Group {
	id: string;
	name: string;
	is_personal: boolean;
	role: "owner" | "member";
	is_active: boolean;
}
export interface Category {
	id: string;
	name: string;
	sort_order: number;
	is_default: boolean;
}
export interface MediaFile {
	id: string;
	group_id: string;
	file_type: string;
	original_filename?: string;
	url?: string;
	description?: string;
	status: string;
	created_at: string;
}
export interface Space {
	id: string;
	name: string;
	description?: string;
	cover_url?: string;
	visibility: string;
	is_default: boolean;
	creator_id: string;
	file_count: number;
}
export interface Style {
	id: string;
	key: string;
	name: string;
	sort_order: number;
	is_active: boolean;
}
export interface Theme {
	id: string;
	style_id: string;
	name: string;
	color_mode: string;
	is_system: boolean;
	is_active: boolean;
	bg_image_url?: string;
	bg_video_url?: string;
	effect_config: Record<string, unknown>;
}
export interface Member {
	user_id: string;
	username: string;
	nickname?: string;
	role: string;
	joined_at: string;
}
