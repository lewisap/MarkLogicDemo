package org.alewis.demo.controllers;

import java.util.List;
import java.util.Map;

import org.alewis.database.AdminHelper;
import org.alewis.database.SearchHelper;
import org.alewis.model.Person;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marklogic.client.document.JSONDocumentManager;
import com.marklogic.client.io.DocumentMetadataHandle;
import com.marklogic.client.io.StringHandle;
import com.marklogic.client.query.MatchDocumentSummary;

/**
 * Class to expose all AJAX request handlers for this application.
 * 
 * @author lewisap
 *
 */
@RestController
public class DataIngestController {
	private static final Logger logger = LoggerFactory.getLogger(DataIngestController.class);
	
	@Autowired private SearchHelper searchHelper;
	@Autowired private AdminHelper adminHelper;
	
	/**
	 * 
	 * @param criteria
	 * @param page
	 * @return
	 * @throws Exception
	 */
	@RequestMapping(value = "getPeople")
	public List<MatchDocumentSummary> searchPeople(String criteria, Integer page) throws Exception {
		System.out.println(criteria);
		return searchHelper.getAllPeopleByCriteria(criteria, page);
	}
	
	/**
	 * 
	 * @param uri
	 * @throws Exception
	 */
	@RequestMapping(value = "deletePerson", method = RequestMethod.POST)
	public void deletePerson(@RequestBody String uri) throws Exception {
		logger.debug("URI = " + uri);
		searchHelper.deletePerson(uri);
	}
	
	@RequestMapping(value = "setQueryOptions", method = RequestMethod.POST)
	public void setQueryOptions() throws Exception {
		adminHelper.setQueryOptions();
		searchHelper.showQueryOptions();
	}
	
	@RequestMapping(value = "clearQueryOptions", method = RequestMethod.POST)
	public void clearQueryOptions() throws Exception {
		adminHelper.clearQueryOptions();
		searchHelper.showQueryOptions();
	}
	
//	@RequestMapping(value = "getCompanies", method = RequestMethod.GET)
//	public List<String> getCompanies() throws Exception {
//		return searchHelper.getCompanyList();
//	}
//	
//	@RequestMapping(value = "getStates", method = RequestMethod.GET)
//	public List<String> getStates() throws Exception {
//		return searchHelper.getStateList();
//	}
	
	@RequestMapping(value = "getSearchFacets", method = RequestMethod.GET)
	public Map<String, Object[]> getSearchFacets(String criteria) throws Exception {
		return searchHelper.getSearchResultFacets(criteria);
	}
	
	@RequestMapping(value = "getFilteredPeople")
	public List<MatchDocumentSummary> getFilteredPeople(String criteria, Integer page, String state,String company) throws Exception {
		System.out.println(criteria + " | " + state + " | " + company);
		return searchHelper.getFilteredPeople(criteria, page, state, company);
	}
	
	@RequestMapping(value = "getFilteredTotalResults")
	public Long getFilteredTotalResults(String criteria, String state,String company) throws Exception {
		System.out.println(criteria + " | " + state + " | " + company);
		return searchHelper.getFilteredTotalResults(criteria, state, company);
	}
	
	@RequestMapping(value = "getFilteredSearchFacets")
	public Map<String, Object[]> getFilteredSearchFacets(String criteria, String state, String company) throws Exception {
		return searchHelper.getFilteredSearchResultFacets(criteria, state, company);
	}
	
	/**
	 * 
	 * @param criteria
	 * @return
	 * @throws Exception
	 */
	@RequestMapping(value = "getTotalResults")
	public Long getTotalResults(String criteria) throws Exception {
		logger.debug(criteria);
		return searchHelper.getTotalResults(criteria);
	}
	
	/**
	 * 
	 * @param uri
	 * @return
	 * @throws Exception
	 */
	@RequestMapping(value = "retrievePerson")
	public String retrievePerson(String uri) throws Exception {
		logger.debug(uri);
		return searchHelper.retrievePersonAsJSON(uri);
	}
	
	/**
	 * Controller method to listen for insertPerson, and given an input Person class, write the 
	 * person to the database
	 * 
	 * @param people
	 * @return
	 * @throws Exception 
	 */
	@RequestMapping(value = "insertPeople", method = RequestMethod.POST)
	public void insertPerson(@RequestBody List<Person> people) throws Exception {
		/*
		 * pass in a Person object and tell the controller method that is should
		 * be built from the request body (@RequestBody) - uses Jackson by default if found on classpath
		 */
		searchHelper.writePeople(people);
	}
	
	@RequestMapping(value = "updatePerson", method = RequestMethod.POST)
	public void updatePerson(@RequestBody Person person) {
		System.out.println(person.toString() + " | " + person.getUri());
		logger.debug(person.toString() + " | " + person.getUri());
		try {
			searchHelper.updatePerson(person.getUri(), person);
		} catch (JsonProcessingException e) {
			e.printStackTrace();
		}
	}
	
	@SuppressWarnings("unused")
	private void writePerson(Person person) throws JsonProcessingException {
		JSONDocumentManager doc = searchHelper.getNewJSONDocumentManager();
		
		// assign the people to the 'people' collection
		DocumentMetadataHandle metadata = new DocumentMetadataHandle();
		metadata.getCollections().addAll("people");
		
		ObjectMapper mapper = new ObjectMapper();
		String json = mapper.writeValueAsString(person);
		logger.info(json);
		
		// Create or update a JSON document
		doc.write("people/" + person.getName().replaceAll("\\s",""), metadata, new StringHandle(json));
		searchHelper.closeConnection();
	}
}