package kr.kro.relationboat.app.sync

import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch

@Singleton
class SyncCoordinator @Inject constructor() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val _events = MutableSharedFlow<Long>(extraBufferCapacity = 8)
    val events = _events.asSharedFlow()

    fun requestBackgroundSync(dispatcher: CoroutineDispatcher = Dispatchers.IO) {
        scope.launch(dispatcher) { _events.emit(System.currentTimeMillis()) }
    }
}
