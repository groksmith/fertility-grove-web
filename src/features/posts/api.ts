/* The posts, comments, votes and saves endpoints, and the public (guest) reads. */

import type { CommentDto, GroupDto, PostListDto, PostSummaryDto } from "@/lib/api/content";
import { PAGE_SIZE, type Paged } from "@/lib/api/query";
import { httpClient, type Query } from "@/lib/http";

export interface WriteDto {
  id: string;
  showCrisisResources: boolean;
  heldForReview: boolean;
  heldMessage: string | null;
}

export interface PostDetailDto {
  post: PostSummaryDto;
  commentSort: "Top" | "Newest";
  comments: CommentDto[];
}

export interface MyReplyDto {
  commentId: string;
  postId: string;
  groupId: string | null;
  groupName: string | null;
  isSuccessStory: boolean;
  postTitle: string | null;
  body: string | null;
  score: number;
  status: string;
  isEdited: boolean;
  createdAt: string;
}

export interface VisitorPostDto {
  id: string;
  groupId: string;
  groupName: string | null;
  type: string;
  title: string | null;
  body: string | null;
  source: string;
  sourceLink: string | null;
  topicTags: string[];
  authorDisplayName: string | null;
  authorTreeLevel: string;
  authorPronouns: string | null;
  authorBadge: string | null;
  score: number;
  replyCount: number;
  isEdited: boolean;
  createdAt: string;
}

export interface PublicPostDto {
  id: string;
  shownToVisitors: boolean;
  visitor: VisitorPostDto | null;
  groupName: string | null;
  title: string | null;
}

const paged = (page: number) => ({ page, pageSize: PAGE_SIZE });

export const postsApi = {
  feed: (page: number, q: Query) =>
    httpClient.get<PostListDto>("/feed", { query: { ...paged(page), ...q } }),
  followingFeed: (page: number) =>
    httpClient.get<PostListDto>("/feed/following", { query: paged(page) }),
  groupPosts: (groupId: string, sort: string, page: number) =>
    httpClient.get<PostListDto>(`/groups/${groupId}/posts`, { query: { ...paged(page), sort } }),
  post: (id: string, commentSort?: string) =>
    httpClient.get<PostDetailDto>(`/posts/${id}`, { query: { commentSort } }),
  myPosts: (page: number) =>
    httpClient.get<PostListDto>("/profile/me/posts", { query: paged(page) }),
  myStories: (page: number) =>
    httpClient.get<PostListDto>("/profile/me/stories", { query: paged(page) }),
  myReplies: (page: number) =>
    httpClient.get<{ replies: MyReplyDto[] } & Paged>("/profile/me/replies", {
      query: paged(page),
    }),
  saved: (page: number) => httpClient.get<PostListDto>("/profile/me/saved", { query: paged(page) }),
  matched: () =>
    httpClient.get<{ posts: { post: PostSummaryDto; reason: string | null }[] }>("/matches/posts"),

  create: (groupId: string, body: unknown) =>
    httpClient.send<WriteDto>("POST", `/groups/${groupId}/posts`, body),
  edit: (id: string, body: unknown) => httpClient.send<WriteDto>("PUT", `/posts/${id}`, body),
  remove: (id: string) => httpClient.delete(`/posts/${id}`),
  vote: (id: string, direction: "Up" | "Down") => httpClient.put(`/posts/${id}/vote`, direction),
  save: (id: string, saved: boolean) => httpClient.put(`/posts/${id}/saved`, saved),
  comment: (postId: string, body: unknown) =>
    httpClient.send<WriteDto>("POST", `/posts/${postId}/comments`, body),
  editComment: (id: string, body: unknown) =>
    httpClient.send<WriteDto>("PUT", `/comments/${id}`, body),
  removeComment: (id: string) => httpClient.delete(`/comments/${id}`),
  voteComment: (id: string, direction: "Up" | "Down") =>
    httpClient.put(`/comments/${id}/vote`, direction),

  publicFeed: (groupId?: string, page = 1) =>
    httpClient.get<{ posts: VisitorPostDto[] } & Paged>("/public/feed", {
      anonymous: true,
      query: { ...paged(page), groupId },
    }),
  publicGroups: () => httpClient.get<{ groups: GroupDto[] }>("/public/groups", { anonymous: true }),
  publicGroup: (id: string) =>
    httpClient.get<GroupDto>(`/public/groups/${id}`, { anonymous: true }),
  publicPost: (id: string) =>
    httpClient.get<PublicPostDto>(`/public/posts/${id}`, { anonymous: true }),
};
