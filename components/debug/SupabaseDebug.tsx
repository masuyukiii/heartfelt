"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUsers } from '@/lib/supabase/users';

export default function SupabaseDebug() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; name?: string; email: string }>>([]);
  const [profiles, setProfiles] = useState<Array<{ id: string; name?: string; department?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      const supabase = createClient();
      
      // 現在のユーザー取得
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(`User error: ${userError.message}`);
      setUser(currentUser);

      // プロファイル取得
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) {
        console.error('Profiles error:', profilesError);
        setError(`Profiles error: ${profilesError.message}`);
      } else {
        setProfiles(profilesData || []);
      }

      // ユーザー一覧取得（関数経由）
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Debug error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 bg-gray-100 rounded">Loading debug info...</div>;

  return (
    <div className="p-4 bg-gray-100 rounded space-y-4 text-sm">
      <h3 className="font-bold text-lg">Supabase Debug Info</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="bg-white p-3 rounded border">
        <h4 className="font-semibold">Current User:</h4>
        <pre className="mt-2 text-xs overflow-x-auto">
          {user ? JSON.stringify(user, null, 2) : 'No user'}
        </pre>
      </div>

      <div className="bg-white p-3 rounded border">
        <h4 className="font-semibold">Profiles Table ({profiles.length} records):</h4>
        <pre className="mt-2 text-xs overflow-x-auto">
          {JSON.stringify(profiles, null, 2)}
        </pre>
      </div>

      <div className="bg-white p-3 rounded border">
        <h4 className="font-semibold">getUsers() Result ({users.length} users):</h4>
        <pre className="mt-2 text-xs overflow-x-auto">
          {JSON.stringify(users, null, 2)}
        </pre>
      </div>

      <button 
        onClick={loadDebugInfo}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Refresh Debug Info
      </button>
    </div>
  );
}