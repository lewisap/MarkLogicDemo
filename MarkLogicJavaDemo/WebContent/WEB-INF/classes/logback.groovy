import ch.qos.logback.classic.encoder.PatternLayoutEncoder
import ch.qos.logback.core.ConsoleAppender

import static ch.qos.logback.classic.Level.DEBUG
import static ch.qos.logback.classic.Level.INFO

def LOG_PATH = "/tmp/"

// standard out appender
appender("STDOUT", ConsoleAppender) {
	encoder(PatternLayoutEncoder) {
		pattern = "%d{HH:mm:ss.SSS} %level %logger - %msg %n"
	}
}

// define the appender for the general rolling file appender
appender("FILE", RollingFileAppender) {
	file = "${LOG_PATH}/MarkLogicJavaDemo.log"
	append = true
	rollingPolicy(TimeBasedRollingPolicy) {
    	fileNamePattern = "${LOG_PATH}/MarkLogicJavaDemo.%d{yyyy-MM-dd}.log"
  	}
	encoder(PatternLayoutEncoder) {
		pattern = "%.1024(%d{HH:mm:ss.SSS} %level %logger - %msg %n)"
	}
}

// define the appender for the performance logging
appender("PERF_LOG", RollingFileAppender) {
	file = "${LOG_PATH}/MarkLogicJavaDemo-perf.log"
	append = true
	rollingPolicy(TimeBasedRollingPolicy) {
    	fileNamePattern = "${LOG_PATH}/MarkLogicJavaDemo-perf.%d{yyyy-MM-dd}.log"
  	}
	encoder(PatternLayoutEncoder) {
		pattern = "%.1024(%d{HH:mm:ss.SSS} %level %logger - %msg %n)"
	}
}

logger("org.springframework", DEBUG)				// spring logging
logger("performance", INFO, ["PERF_LOG"], false)	// performance logging

root(DEBUG, ["FILE"])								// root logger