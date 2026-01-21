'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Papa from 'papaparse';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';

type FormValues = {
    subject: string;
    body: string;
    startTime: string;
    minDelay: number;
    hourlyLimit: number;
};

export default function ComposePage() {
    const { user, session } = useAuth();
    const router = useRouter();
    const [recipients, setRecipients] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        Papa.parse(file, {
            complete: (results) => {
                // Assume CSV has a column 'email' or valid emails in first column
                const foundEmails: string[] = [];
                results.data.forEach((row: any) => {
                    // simple check for array or object
                    const email = row.email || row[0];
                    if (email && email.includes('@')) {
                        foundEmails.push(email.trim());
                    }
                });
                setRecipients(foundEmails);
                setIsUploading(false);
            },
            header: true // try with header first
        });
    };

    const onSubmit = async (data: FormValues) => {
        if (recipients.length === 0) {
            alert("Please upload a CSV with recipients");
            return;
        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            console.log('🚀 Attempting to schedule with API URL:', apiUrl); // DEBUG LOG
            await axios.post(`${apiUrl}/api/schedule`, {
                userId: user?.id,
                ...data,
                recipients,
                minDelay: Number(data.minDelay),
                hourlyLimit: Number(data.hourlyLimit)
            });
            router.push('/dashboard');
        } catch (err) {
            console.error(err);
            alert("Failed to schedule");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
                <h1 className="text-2xl font-bold mb-6 text-gray-900">Compose New Campaign</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Subject</label>
                        <input
                            {...register('subject', { required: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-gray-900"
                        />
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Body</label>
                        <textarea
                            {...register('body', { required: true })}
                            rows={4}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-gray-900"
                        />
                    </div>

                    {/* CSV Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Recipients (CSV)</label>
                        <div className="mt-1 flex items-center space-x-4">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                            <span className="text-sm text-gray-500">
                                {isUploading ? 'Parsing...' : `${recipients.length} emails found`}
                            </span>
                        </div>
                    </div>

                    {/* Config Grid */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Time</label>
                            <input
                                type="datetime-local"
                                min={new Date().toISOString().slice(0, 16)}
                                {...register('startTime')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Min Delay (sec)</label>
                            <input
                                type="number"
                                {...register('minDelay', { value: 10 })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Hourly Limit</label>
                            <input
                                type="number"
                                {...register('hourlyLimit', { value: 50 })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-5">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 mr-3"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Schedule Campaign
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
