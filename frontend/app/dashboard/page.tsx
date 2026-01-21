'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';
import { DataTable } from '@/components/DataTable';

interface Email {
    id: string;
    recipient: string;
    subject: string;
    status: 'PENDING' | 'SENT' | 'FAILED' | 'THROTTLED';
    sentAt: string | null;
}

export default function Dashboard() {
    const { user, session } = useAuth();
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    const { data: stats } = useQuery({
        queryKey: ['stats', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await axios.get(`${apiUrl}/api/users/${user.id}/stats`);
            return res.data;
        },
        enabled: !!user?.id
    });

    const { data: emails, isLoading } = useQuery<Email[]>({
        queryKey: ['emails', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await axios.get(`${apiUrl}/api/users/${user.id}/emails`);
            return res.data;
        },
        enabled: !!user?.id,
        refetchInterval: 5000
    });

    const scheduledEmails = emails?.filter((e) => e.status === 'PENDING' || e.status === 'THROTTLED') || [];
    const sentEmails = emails?.filter((e) => e.status === 'SENT' || e.status === 'FAILED') || [];

    const StatusPill = ({ status }: { status: string }) => {
        const color = status === 'SENT' ? 'bg-green-100 text-green-800' :
            status === 'FAILED' ? 'bg-red-100 text-red-800' :
                status === 'THROTTLED' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800';

        return (
            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${color}`}>
                {status}
            </span>
        );
    };

    if (status === 'loading') return <div className="p-10 text-center">Loading dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900">ReachInbox Scheduler</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            {session?.user?.image && (
                                <img
                                    src={session.user.image}
                                    alt="Avatar"
                                    className="w-8 h-8 rounded-full"
                                />
                            )}
                            <div className="text-sm text-gray-700">
                                {session?.user?.name} ({session?.user?.email})
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
                {/* Stats */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                        <dt className="truncate text-sm font-medium text-gray-500">Scheduled</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats?.scheduled || 0}</dd>
                    </div>
                    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                        <dt className="truncate text-sm font-medium text-gray-500">Sent</dt>
                        <dd className="mt-1 text-3xl font-semibold text-green-600">{stats?.sent || 0}</dd>
                    </div>
                    <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                        <dt className="truncate text-sm font-medium text-gray-500">Failed</dt>
                        <dd className="mt-1 text-3xl font-semibold text-red-600">{stats?.failed || 0}</dd>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex justify-end mb-4">
                    <Link
                        href="/dashboard/compose"
                        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                        Compose New Email
                    </Link>
                </div>

                {/* Scheduled Emails Table */}
                <DataTable<Email>
                    title="Scheduled Emails (Pending)"
                    data={scheduledEmails}
                    isLoading={isLoading}
                    emptyMessage="No emails currently scheduled."
                    columns={[
                        { header: 'Recipient', accessor: (e) => e.recipient },
                        { header: 'Subject', accessor: (e) => e.subject },
                        { header: 'Status', accessor: (e) => <StatusPill status={e.status} /> },
                        { header: 'Scheduled For', accessor: (e) => 'ASAP' }, // Simplified default
                    ]}
                />

                {/* Sent Emails Table */}
                <DataTable<Email>
                    title="Sent / History"
                    data={sentEmails}
                    isLoading={isLoading}
                    emptyMessage="No emails sent yet."
                    columns={[
                        { header: 'Recipient', accessor: (e) => e.recipient },
                        { header: 'Subject', accessor: (e) => e.subject },
                        { header: 'Status', accessor: (e) => <StatusPill status={e.status} /> },
                        { header: 'Time', accessor: (e) => e.sentAt ? new Date(e.sentAt).toLocaleString() : '-' },
                    ]}
                />
            </main>
        </div>
    );
}
