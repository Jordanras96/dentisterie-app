import PatientDetailClient from './patient-detail'

export async function generateStaticParams() {
  return []
}

export default function PatientDetailPage() {
  return <PatientDetailClient />
}
