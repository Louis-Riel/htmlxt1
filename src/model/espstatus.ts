export interface EspStatus {
	deviceid: number;
	uptime_sec: number;
	sleeptime_us: number;
	freeram: number;
	totalram: number;
	MALLOC_CAP_EXEC: number;
	MALLOC_CAP_32BIT: number;
	MALLOC_CAP_8BIT: number;
	MALLOC_CAP_DMA: number;
	MALLOC_CAP_PID2: number;
	MALLOC_CAP_PID3: number;
	MALLOC_CAP_PID4: number;
	MALLOC_CAP_PID5: number;
	MALLOC_CAP_PID6: number;
	MALLOC_CAP_PID7: number;
	MALLOC_CAP_SPIRAM: number;
	MALLOC_CAP_INTERNAL: number;
	MALLOC_CAP_IRAM_8BIT: number;
	battery: number;
	temperature: number;
	hallsensor: number;
	openfiles: number;
	runtime_us: number;
	systemtime_us: number;
}