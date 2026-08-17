/**
 * WeChat iLink Bot API protocol types.
 */
export declare const MessageType: {
  readonly NONE: 0;
  readonly USER: 1;
  readonly BOT: 2;
};
export declare const MessageItemType: {
  readonly NONE: 0;
  readonly TEXT: 1;
  readonly IMAGE: 2;
  readonly VOICE: 3;
  readonly FILE: 4;
  readonly VIDEO: 5;
};
export declare const MessageState: {
  readonly NEW: 0;
  readonly GENERATING: 1;
  readonly FINISH: 2;
};
export interface BaseInfo {
  channel_version?: string;
}
export interface CDNMedia {
  encrypt_query_param?: string;
  aes_key?: string;
  encrypt_type?: number;
}
export interface TextItem {
  text?: string;
}
export interface ImageItem {
  media?: CDNMedia;
  thumb_media?: CDNMedia;
  aeskey?: string;
  url?: string;
  mid_size?: number;
}
export interface VoiceItem {
  media?: CDNMedia;
  text?: string;
}
export interface FileItem {
  media?: CDNMedia;
  file_name?: string;
  md5?: string;
  len?: string;
}
export interface VideoItem {
  media?: CDNMedia;
  video_size?: number;
}
export interface RefMessage {
  message_item?: MessageItem;
  title?: string;
}
export interface MessageItem {
  type?: number;
  text_item?: TextItem;
  image_item?: ImageItem;
  voice_item?: VoiceItem;
  file_item?: FileItem;
  video_item?: VideoItem;
  ref_msg?: RefMessage;
}
export interface WeixinMessage {
  seq?: number;
  message_id?: number;
  from_user_id?: string;
  to_user_id?: string;
  client_id?: string;
  create_time_ms?: number;
  session_id?: string;
  message_type?: number;
  message_state?: number;
  item_list?: MessageItem[];
  context_token?: string;
}
export interface GetUpdatesReq {
  get_updates_buf?: string;
  base_info?: BaseInfo;
}
export interface GetUpdatesResp {
  ret?: number;
  errcode?: number;
  errmsg?: string;
  msgs?: WeixinMessage[];
  get_updates_buf?: string;
  longpolling_timeout_ms?: number;
}
export interface SendMessageReq {
  msg?: WeixinMessage;
  base_info?: BaseInfo;
}
export declare const TypingStatus: {
  readonly TYPING: 1;
  readonly CANCEL: 2;
};
export interface GetConfigResp {
  ret?: number;
  errmsg?: string;
  typing_ticket?: string;
}
export interface SendTypingReq {
  ilink_user_id?: string;
  typing_ticket?: string;
  status?: number;
  base_info?: BaseInfo;
}
export interface SendTypingResp {
  ret?: number;
  errmsg?: string;
}
