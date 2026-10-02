// TSX tour: JSX, React and Next.js
import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { NextPage } from 'next';
import Link from 'next/link';

type Props = { title: string; children?: ReactNode };

/** A card that counts its clicks. */
export function Card({ title, children }: Props): JSX.Element {
  const [count, setCount] = useState<number>(0);
  const router = useRouter();
  const label = useMemo(() => title.toUpperCase(), [title]);
  const onClick = () => setCount(c => c + 1);

  return (
    <section className="card" aria-label={label}>
      <h2>{title}</h2>
      <p>Don't click more than {count > 9 ? 'ten' : count} times.</p>
      <button type="button" disabled={count > 9} onClick={onClick}>
        Click me
      </button>
      <Link href={`/items/${count}`} prefetch={false}>
        Open item <b>{count}</b>
      </Link>
      {children}
      <>
        <Icon name="star" size={24} />
        <Spacer />
      </>
    </section>
  );
}

const Layout: FC<{ children: ReactNode }> = ({ children }) => (
  <main onClick={() => router.push('/')}>{children}</main>
);

const Home: NextPage = () => (
  <Layout>
    <Card title="Home">Welcome back</Card>
  </Layout>
);

export default Home;
