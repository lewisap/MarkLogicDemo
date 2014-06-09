package org.alewis.database.base;

import org.alewis.database.Constants;

import com.marklogic.client.DatabaseClient;
import com.marklogic.client.DatabaseClientFactory;
import com.marklogic.client.DatabaseClientFactory.Authentication;

/**
 * Parent class of the database classes that handles simple database connection setup
 * - retrieves a connection
 * - exposes the close connection 
 * 
 * @author lewisap
 *
 */
public class HelperBase {
	private DatabaseClient client = null;

	public DatabaseClient getClient() {
		if (client == null) {
			client = DatabaseClientFactory.newClient(	Constants.hostname, 
														Constants.port, 
														Constants.username, 
														Constants.password, 
														Authentication.DIGEST);
		}

		return client;
	}

	public void setClient(DatabaseClient client) {
		this.client = client;
	}
	
	public void closeConnection() {
		getClient().release();
		setClient(null);
	}
}
