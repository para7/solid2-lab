import { Title } from '@solidjs/meta';

export default function About() {
  return (
    <main>
      <Title>About - Solid App</Title>
      <h1>About</h1>
      <p>このページはビルド時に ssg されてます</p>
      <div>{new Date().toLocaleString()}</div>
    </main>
  );
}
