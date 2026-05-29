import { getAuditLogsAction } from '@/app/actions/analytics-actions'
import { AuditLogsTable } from '@/components/dashboard/audit-logs-table'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Audit Logs | Ngaturin Admin',
  description: 'View administrative actions and system logs.',
}

export default async function AuditLogsPage() {
  const logs = await getAuditLogsAction()

  return (
    <div className="flex flex-col gap-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-[48px] font-black uppercase italic tracking-tighter leading-none text-near-black">
          System <span className="text-wise-green">Audit</span> Logs
        </h1>
        <p className="text-wise-gray font-semibold text-sm">
          A comprehensive record of all administrative actions performed across the platform.
        </p>
      </div>

      <div className="grid grid-cols-1">
        <AuditLogsTable data={logs} />
      </div>
    </div>
  )
}
