package org.alewis.database;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.alewis.model.Person;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marklogic.client.DatabaseClient;
import com.marklogic.client.DatabaseClientFactory;
import com.marklogic.client.DatabaseClientFactory.Authentication;
import com.marklogic.client.admin.QueryOptionsManager;
import com.marklogic.client.admin.config.QueryOptions;
import com.marklogic.client.admin.config.QueryOptionsBuilder;
import com.marklogic.client.document.GenericDocumentManager;
import com.marklogic.client.document.JSONDocumentManager;
import com.marklogic.client.io.DocumentMetadataHandle;
import com.marklogic.client.io.QueryOptionsHandle;
import com.marklogic.client.io.QueryOptionsListHandle;
import com.marklogic.client.io.SearchHandle;
import com.marklogic.client.io.StringHandle;
import com.marklogic.client.io.ValuesHandle;
import com.marklogic.client.query.CountedDistinctValue;
import com.marklogic.client.query.MatchDocumentSummary;
import com.marklogic.client.query.QueryManager;
import com.marklogic.client.query.StringQueryDefinition;
import com.marklogic.client.query.ValuesDefinition;

@SuppressWarnings("deprecation")
@Component
public class DatabaseHelper {
	private static final Logger logger = LoggerFactory.getLogger(DatabaseHelper.class);
	private static int PAGE_SIZE = 5;

	//54.86.23.55
	private String 	hostname = "localhost";		//DemoRestServer
	private Integer 	port = 8003;
	private String 	username = "root";
	private String 	password = "qwerty";

	private DatabaseClient client = null;

	public String getHostname() {
		return hostname;
	}

	public void setHostname(String hostname) {
		this.hostname = hostname;
	}

	public Integer getPort() {
		return port;
	}

	public void setPort(Integer port) {
		this.port = port;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	private DatabaseClient getClient() {
		if (client == null) {
			client = DatabaseClientFactory.newClient(hostname, port, username, password, Authentication.DIGEST);
		}

		return client;
	}

	private void setClient(DatabaseClient client) {
		this.client = client;
	}

	public void closeConnection() {
		getClient().release();
		setClient(null);
	}

	public JSONDocumentManager getNewJSONDocumentManager() {
		// Get a new JSON Document Manager
		JSONDocumentManager doc = getClient().newJSONDocumentManager();

		return doc;
	}
	
	public String retrievePersonAsJSON(String uri) {
		JSONDocumentManager docMgr = getNewJSONDocumentManager();
		StringHandle handle = new StringHandle();
		
		docMgr.read(uri, handle);

		return handle.get();
	}
	
	public void updatePerson(String uri, Person person) throws JsonProcessingException {
		JSONDocumentManager doc = getNewJSONDocumentManager();
		
		// assign the people to the 'people' collection
		DocumentMetadataHandle metadata = new DocumentMetadataHandle();
		metadata.getCollections().addAll("people");
		
		ObjectMapper mapper = new ObjectMapper();
		String json;
		json = mapper.writeValueAsString(person);
		
		// Create or update a JSON document,
		// use the passed in URI as the doc uri so we don't create a new doc if the name changed
		doc.write(uri, metadata, new StringHandle(json));
		logger.info(json);

		closeConnection();
	}
	
	public void writePeople(List<Person> people) throws JsonProcessingException {
		JSONDocumentManager doc = getNewJSONDocumentManager();
		
		// assign the people to the 'people' collection
		DocumentMetadataHandle metadata = new DocumentMetadataHandle();
		metadata.getCollections().addAll("people");
		
		ObjectMapper mapper = new ObjectMapper();
		String json;
		for (Person p: people) {
			json = mapper.writeValueAsString(p);
			// Create or update a JSON document
			doc.write("people/" + p.getName().replaceAll("\\s",""), metadata, new StringHandle(json));
			logger.info(json);
		}
		
		closeConnection();
	}

	public List<MatchDocumentSummary> searchPeople(String criteria, String companyFilter, String stateFilter, Integer page) 
													throws JsonParseException, JsonMappingException, IOException {
		int start;

		if (page != null) {
			start = PAGE_SIZE * (page - 1) + 1;
		} else {
			start = 1;
		}
		
		// TODO gotta start figuring out how to use other queries to constrain the results
		// check evernote for the hint

		QueryManager queryMgr = getClient().newQueryManager();
		queryMgr.setPageLength(PAGE_SIZE);

		StringQueryDefinition query = null;
		
		if (companyFilter == null) companyFilter = "";
		if (stateFilter == null) stateFilter = "";
		
		if (!companyFilter.equals("") && !stateFilter.equals("")) {
			System.out.println("USING statesAndCompanies");
			query = queryMgr.newStringDefinition("statesAndCompanies");
		} else if (!companyFilter.equals("")) {
			System.out.println("USING companies");
			query = queryMgr.newStringDefinition("companies");
		} else if (!stateFilter.equals("")) {
			System.out.println("USING states");
			query = queryMgr.newStringDefinition("states");
		} else {
			query = queryMgr.newStringDefinition();
		}
		
		query.setCriteria(criteria);
		query.setCollections("people");

		SearchHandle resultsHandle = new SearchHandle();
		queryMgr.search(query, resultsHandle, start);

		System.out.println("Matched " + resultsHandle.getTotalResults() + " documents with '" + query.getCriteria() + "'\n");

		// iterate over the result documents
		MatchDocumentSummary[] docSummaries = resultsHandle.getMatchResults();
		System.out.println("Listing "+docSummaries.length+" documents:\n");

		closeConnection();
		
		return Arrays.asList(docSummaries);
	}
	
	public Long getTotalResults(String criteria) throws JsonParseException, JsonMappingException, IOException {
		QueryManager queryMgr = getClient().newQueryManager();

		StringQueryDefinition query = queryMgr.newStringDefinition();
		query.setCriteria(criteria);
		query.setCollections("people");

		SearchHandle resultsHandle = new SearchHandle();
		queryMgr.search(query, resultsHandle);
		
		closeConnection();

		return resultsHandle.getTotalResults();
	}
	
	/**
	 * Delete a document from the database
	 * 
	 * @param uri - the unique uri specifying the document
	 */
	public void deletePerson(String uri) {
		GenericDocumentManager docMgr = getClient().newDocumentManager();
		
		docMgr.delete(uri);
		
		closeConnection();
	}
	
	public List<String> getCompanyList() {
		List<String> companies = new ArrayList<String>();
		
		QueryManager queryMgr = getClient().newQueryManager();
		
		ValuesDefinition valuesDef = queryMgr.newValuesDefinition("companyName", "companies");
		// retrieve the values
		ValuesHandle valuesHandle = queryMgr.values(valuesDef, new ValuesHandle());
		
		for (CountedDistinctValue val : valuesHandle.getValues()) {
			companies.add(val.get("xs:string", String.class));
			//System.out.println(val.get("xs:string", String.class) + " | " + val.getCount());
		}
		
		closeConnection();
		
		return companies;
	}
	
	public List<String> getStateList() {
		List<String> states = new ArrayList<String>();
		
		QueryManager queryMgr = getClient().newQueryManager();
		
		ValuesDefinition valuesDef = queryMgr.newValuesDefinition("state", "states");
		// retrieve the values
		ValuesHandle valuesHandle = queryMgr.values(valuesDef, new ValuesHandle());
		
		for (CountedDistinctValue val : valuesHandle.getValues()) {
			states.add(val.get("xs:string", String.class));
			//System.out.println(val.get("xs:string", String.class) + " | " + val.getCount());
		}
		
		closeConnection();
		
		return states;
	}
	
	
	
	public void showQueryOptions() {
		QueryManager queryMgr = getClient().newQueryManager();
		QueryOptionsListHandle listHandle = new QueryOptionsListHandle();

		queryMgr.optionsList(listHandle);
		
		for (Map.Entry<String,String> optionsSet : listHandle.getValuesMap().entrySet()) {
		    System.out.println(optionsSet.getKey() + ": " + optionsSet.getValue());                        
		}
		
		closeConnection();
	}
	
	public void setQueryOptions() {
		QueryOptionsManager optMgr = getClient().newServerConfigManager().newQueryOptionsManager();
		//optMgr.deleteOptions("companies");
		
		QueryOptionsBuilder optBldr = new QueryOptionsBuilder();

		// expose the "companyName" JSON key range index as "companyName" values
		QueryOptionsHandle optHandle = new QueryOptionsHandle().withValues(
				optBldr.values("companyName",
						optBldr.range(
								optBldr.jsonRangeIndex("companyName",
										optBldr.stringRangeType(QueryOptions.DEFAULT_COLLATION))), "frequency-order"));
		 
		// write the query options to the database
		optMgr.writeOptions("companies", optHandle);
		
		optHandle = new QueryOptionsHandle().withValues(
				optBldr.values("state",
						optBldr.range(
								optBldr.jsonRangeIndex("state",
										optBldr.stringRangeType(QueryOptions.DEFAULT_COLLATION))), "frequency-order"));
		
		optMgr.writeOptions("states", optHandle);
		
		optHandle = new QueryOptionsHandle().withValues(
				optBldr.values("state",
						optBldr.range(
								optBldr.jsonRangeIndex("state",
										optBldr.stringRangeType(QueryOptions.DEFAULT_COLLATION))), "frequency-order"),
				optBldr.values("companyName",
						optBldr.range(
								optBldr.jsonRangeIndex("companyName",
										optBldr.stringRangeType(QueryOptions.DEFAULT_COLLATION))), "frequency-order")
		);
		
		optMgr.writeOptions("statesAndCompanies", optHandle);
		
		closeConnection();
	}
}
