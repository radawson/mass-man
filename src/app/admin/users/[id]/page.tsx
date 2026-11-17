import AdminUserWorkspace from '@/components/admin/AdminUserWorkspace'

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AdminUserWorkspace key={id} userId={id} />
}
