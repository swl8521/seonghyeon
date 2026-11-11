// next/og(ImageResponse)는 next/font의 CSS 변수를 쓸 수 없어서, 이미지에 실제로 쓰이는
// 글자만 담긴 서브셋 폰트를 Google Fonts CSS API에서 직접 받아와야 한다.
export async function loadGoogleFont(
  family: string,
  text: string
): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  )}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(cssUrl)).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);

  if (match) {
    const response = await fetch(match[1]);
    if (response.status === 200) {
      return await response.arrayBuffer();
    }
  }

  throw new Error(`failed to load font data for "${family}"`);
}
