interface Props {
  title: string
  description: string
  planned: string[]
}

export function ComingSoon({ title, description, planned }: Props) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md rounded-lg border border-dashed border-neutral-300 p-6 dark:border-neutral-600">
        <p className="mb-1 text-xs font-medium text-amber-600 dark:text-amber-400">준비 중</p>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-400">
          {planned.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
