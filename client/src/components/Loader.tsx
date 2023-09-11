import { FC } from 'react'
import { RxReload } from 'react-icons/rx'

type LoaderProps = { message: string }
const Loader: FC<LoaderProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-600/20 flex justify-center pt-10">
      <div className="bg-white h-max p-4 rounded-md flex flex-col items-center gap-3">
        <div className="animate-spin text-xl">
          <RxReload />
        </div>
        <p>{message}</p>
      </div>
    </div>
  )
}
export default Loader
