import { redirect } from 'next/navigation';

export default function Home() {
  // ルートページから/protectedへ自動リダイレクト
  redirect('/protected');
}