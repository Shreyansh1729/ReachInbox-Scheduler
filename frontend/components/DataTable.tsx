import React from 'react';

interface TableColumn<T> {
    header: string;
    accessor: (item: T) => React.ReactNode;
}

interface TableProps<T> {
    title: string;
    data: T[] | undefined;
    columns: TableColumn<T>[];
    isLoading?: boolean;
    emptyMessage?: string;
    type?: 'scheduled' | 'sent';
}

export function DataTable<T extends { id: string | number }>({
    title,
    data,
    columns,
    isLoading,
    emptyMessage = "No data available",
    type
}: TableProps<T>) {
    return (
        <div className="flex flex-col mt-8">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{title}</h3>
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    {columns.map((col, idx) => (
                                        <th key={idx} scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            {col.header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            {columns.map((_, j) => (
                                                <td key={j} className="px-3 py-4">
                                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : !data || data.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-gray-500">
                                            {emptyMessage}
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((item) => (
                                        <tr key={item.id}>
                                            {columns.map((col, idx) => (
                                                <td key={idx} className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {col.accessor(item)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
