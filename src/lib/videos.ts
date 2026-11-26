export const VIDEO_BASE_URL = "/videos/templates";
export const POSTER_BASE_URL = "/posters";

export function posterFor(id: string): string {
  return `${POSTER_BASE_URL}/${id}.jpg`;
}
