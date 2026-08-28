import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ activityId: string }>
}

export default async function ActivitySettingsRedirect({ params }: Props) {
  const { activityId } = await params
  redirect(`/items/${activityId}/edit`)
}
