import 'snapshot-diff'
import { getSnapshotDiffSerializer } from 'snapshot-diff'
import mockdate from 'mockdate'

// Register `toMatchDiffSnapshot`
require("snapshot-diff/extend-expect")

expect.addSnapshotSerializer(getSnapshotDiffSerializer())

mockdate.set(new Date("2021-05-01T08:00:00.000Z"))
