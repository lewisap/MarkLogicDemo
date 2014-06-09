package org.alewis.database;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.alewis.database.base.HelperBase;
import org.alewis.model.Person;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marklogic.client.document.GenericDocumentManager;
import com.marklogic.client.document.JSONDocumentManager;
import com.marklogic.client.io.DocumentMetadataHandle;
import com.marklogic.client.io.QueryOptionsListHandle;
import com.marklogic.client.io.SearchHandle;
import com.marklogic.client.io.StringHandle;
import com.marklogic.client.io.ValuesHandle;
import com.marklogic.client.query.CountedDistinctValue;
import com.marklogic.client.query.FacetResult;
import com.marklogic.client.query.MatchDocumentSummary;
import com.marklogic.client.query.QueryManager;
import com.marklogic.client.query.StringQueryDefinition;
import com.marklogic.client.query.ValuesDefinition;

/**
 * "Database" class to handle any requests related to searching.
 * 
 * @author lewisap
 *
 */
@Component
public class SearchHelper extends HelperBase {
	private static final Logger logger = LoggerFactory.getLogger(SearchHelper.class);

	public JSONDocumentManager getNewJSONDocumentManager() {
		// Get a new JSON Document Manager
		JSONDocumentManager doc = getClient().newJSONDocumentManager();

		return doc;
	}
	
	public String retrievePersonAsJSON(String uri) {
		JSONDocumentManager docMgr = getNewJSONDocumentManager();
		StringHandle handle = new StringHandle();
		
		docMgr.read(uri, handle);
		
		closeConnection();

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
	
	private Integer getPageNumber(Integer page) {
		Integer start;

		if (page != null) {
			start = Constants.PAGE_SIZE * (page - 1) + 1;
		} else {
			start = 1;
		}

		return start;
	}

	public List<MatchDocumentSummary> getAllPeopleByCriteria(String criteria, Integer page) 
													throws JsonParseException, JsonMappingException, IOException {
		QueryManager queryMgr = getClient().newQueryManager();
		queryMgr.setPageLength(Constants.PAGE_SIZE);

		StringQueryDefinition query = queryMgr.newStringDefinition();
		
		query.setCriteria(criteria);
		query.setCollections("people");

		SearchHandle resultsHandle = new SearchHandle();
		queryMgr.search(query, resultsHandle, getPageNumber(page));

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
	
	// No need for this now that facets work...
	@Deprecated
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
	
	// No need for this now that facets work...
	@Deprecated
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
	
	public Map<String, Object[]> getSearchResultFacets(String criteria) {
		Map<String, Object[]> results = new HashMap<String, Object[]>();
		QueryManager queryMgr = getClient().newQueryManager();
		
		StringQueryDefinition stringQry = queryMgr.newStringDefinition("person-companyName-state-facet");
		stringQry.setCriteria(criteria);

		SearchHandle searchHandle = queryMgr.search(stringQry, new SearchHandle());
		
		for (FacetResult facet: searchHandle.getFacetResults()) {
			if (!facet.getName().equalsIgnoreCase("name")) {
				results.put(facet.getName(), facet.getFacetValues());
			}
		}
		closeConnection();
	
		return results;
	}
	
	private StringQueryDefinition buildFilteredQuery(String criteria, String state, String company, QueryManager queryMgr) {
		boolean isStateFilter = false;
		boolean isCompanyFilter = false;
		
		StringQueryDefinition query;
		
		if (state != null && !state.equalsIgnoreCase("")) {
			isStateFilter = true;
		}
		
		if (company != null && !company.equalsIgnoreCase("")) {
			isCompanyFilter = true;
		}
		
		if (isStateFilter && isCompanyFilter) {
			query = queryMgr.newStringDefinition("peopleByStateAndCompany");
			query.setCriteria(criteria + "and companyName:" + company + "and state:" + state);
			System.out.println(criteria + "  companyName:" + company + " state:" + state);
			
		} else if (isStateFilter && !isCompanyFilter) {
			query = queryMgr.newStringDefinition("peopleByState");
			query.setCriteria(criteria + "  state:" + state);
			System.out.println(criteria + "  state:" + state);
			
		} else if (isCompanyFilter && !isStateFilter) {
			query = queryMgr.newStringDefinition("peopleByCompany");
			query.setCriteria(criteria + "  companyName:" + company);
			System.out.println(criteria + "  companyName:" + company);
			
		} else {
			query = queryMgr.newStringDefinition();
			query.setCriteria(criteria);
		}
		
		return query;
	}
	
	public List<MatchDocumentSummary> getFilteredPeople(String criteria, Integer page, String state, String company) {
		QueryManager queryMgr = getClient().newQueryManager();
		queryMgr.setPageLength(Constants.PAGE_SIZE);
		
		StringQueryDefinition query = buildFilteredQuery(criteria, state, company, queryMgr);
		SearchHandle resultsHandle = queryMgr.search(query, new SearchHandle(), getPageNumber(page));
		
		MatchDocumentSummary[] docSummaries = resultsHandle.getMatchResults();
		System.out.println("Listing "+docSummaries.length+" documents:\n");

		closeConnection();
		
		return Arrays.asList(docSummaries);
	}
	
	public Long getFilteredTotalResults(String criteria, String state, String company) throws JsonParseException, JsonMappingException, IOException {
		QueryManager queryMgr = getClient().newQueryManager();

		StringQueryDefinition query = buildFilteredQuery(criteria, state, company, queryMgr);
		SearchHandle resultsHandle = queryMgr.search(query, new SearchHandle());
		
		closeConnection();

		return resultsHandle.getTotalResults();
	}
	
	public Map<String, Object[]> getFilteredSearchResultFacets(String criteria, String state, String company) {
		boolean isStateFilter = false;
		boolean isCompanyFilter = false;
		Map<String, Object[]> results = new HashMap<String, Object[]>();
		QueryManager queryMgr = getClient().newQueryManager();
		
		if (state != null && !state.equalsIgnoreCase("")) {
			isStateFilter = true;
		}
		
		if (company != null && !company.equalsIgnoreCase("")) {
			isCompanyFilter = true;
		}
		
		StringQueryDefinition query = queryMgr.newStringDefinition("person-companyName-state-facet");
		
		if (isStateFilter && isCompanyFilter) {
			query.setCriteria(criteria + "and companyName:" + company + "and state:" + state);
			System.out.println(criteria + "  companyName:" + company + " state:" + state);
			
		} else if (isStateFilter && !isCompanyFilter) {
			query.setCriteria(criteria + "  state:" + state);
			System.out.println(criteria + "  state:" + state);
			
		} else if (isCompanyFilter && !isStateFilter) {
			query.setCriteria(criteria + "  companyName:" + company);
			System.out.println(criteria + "  companyName:" + company);
			
		} else {
			query.setCriteria(criteria);
		}

		SearchHandle searchHandle = queryMgr.search(query, new SearchHandle());
		
		for (FacetResult facet: searchHandle.getFacetResults()) {
			if (!facet.getName().equalsIgnoreCase("name")) {
				results.put(facet.getName(), facet.getFacetValues());
			}
		}
		closeConnection();
	
		return results;
	}
}