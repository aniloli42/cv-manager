import { FiEye } from 'react-icons/fi'
import { Result, ResumeType, handlePercentageFinding } from '../App'
import Tag from './Tag'
import { FC } from 'react'

type ResultCardType = Partial<ResumeType> & { file?: string }

const ResultCard: FC<ResultCardType> = ({ file, filePath, result }) => {
  const serverURL = import.meta.env.VITE_SERVER_URL
  const serverLink = new URL(serverURL)
  const fileName = filePath?.split('/').at(-1)
  const fileURL = file && new URL(`pdf/${file}`, serverLink)

  return (
    <div className="bg-gray-200 py-1 px-2 rounded grid grid-cols-[auto_max-content] gap-2">
      {fileName && (
        <h3 className="text-base text-gray-00 break-all">{fileName}</h3>
      )}

      <a
        className="[grid-column:2/3] [grid-row:1/3] self-center"
        href={filePath ? filePath : (fileURL as string)}
        target="_blank"
      >
        <FiEye />
      </a>
      <div className="flex gap-1 flex-wrap my-1 items-center">
        {result && (
          <h4 className="text-sm text-gray-500 ">
            {handlePercentageFinding(result)}% matched:
          </h4>
        )}
        {file != undefined ? (
          <>{file}</>
        ) : (
          result?.map((resultItem, index) => (
            <Tag key={index} {...resultItem} />
          ))
        )}
      </div>
    </div>
  )
}

export default ResultCard
