export type DataFormat = 'json' | 'yaml' | 'xml'

export type SerializablePrimitive = string | number | boolean | null

export type SerializableObject = {
  [key: string]: SerializableValue
}

export type SerializableValue = SerializablePrimitive | SerializableValue[] | SerializableObject

export type ParseOptions = {
  format?: DataFormat | string
  sourcePath?: string
}

export type ParseResult = {
  format: DataFormat
  data: SerializableValue
  sourcePath?: string
}
