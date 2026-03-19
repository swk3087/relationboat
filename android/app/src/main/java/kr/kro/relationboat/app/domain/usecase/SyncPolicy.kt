package kr.kro.relationboat.app.domain.usecase

import kr.kro.relationboat.app.domain.model.StorageMode

object SyncPolicy {
    const val maxPathDepth = 8
    const val memoEditableDaysFromToday = 1L

    fun shouldUseRemote(storageMode: StorageMode): Boolean = storageMode == StorageMode.SYNC
}
