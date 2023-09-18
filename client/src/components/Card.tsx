import { ReactNode } from 'react'
import { RxCheck } from 'react-icons/rx'

type CardPropsType = {
  children: ReactNode
  title: string
  caption?: string
  icon: ReactNode
  iconBgColor?: string
  isMinHeightEnable?: boolean
  isMaxHeightEnable?: boolean
}

const Card = ({
  children,
  title,
  caption,
  icon,
  iconBgColor = 'bg-gray-200',
  isMinHeightEnable,
  isMaxHeightEnable
}: CardPropsType) => {
  return (
    <div
      className={` bg-gray-100 shadow-lg shadow-card-body rounded-lg overflow-hidden
      
      `}
    >
      <div className="flex gap-4 items-center py-4 px-5 bg-gray-200 shadow shadow-card-header border-b">
        <div
          className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center ${
            iconBgColor ?? ''
          }`}
        >
          {icon}
        </div>
        <div>
          <h2 className="leading-5 text-lg text-gray-600 ">{title}</h2>
          <p className="flex text-sm text-gray-500">
            {caption ?? '100% Accuracy not guaranteed'}
          </p>
        </div>
      </div>
      <div
        className={`overflow-auto px-4 py-2 
        ${isMaxHeightEnable && 'max-h-[21rem]'}
        ${isMinHeightEnable ? 'min-h-[21rem]' : 'min-h-max'}
      `}
      >
        <div className="my-2 flex flex-col gap-2">{children}</div>
      </div>
    </div>
  )
}

export default Card
