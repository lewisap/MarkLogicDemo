package org.alewis.database;

import java.util.Map;

import javax.xml.namespace.QName;

import org.alewis.database.base.HelperBase;
import org.springframework.stereotype.Component;

import com.marklogic.client.admin.QueryOptionsManager;
import com.marklogic.client.admin.config.QueryOptions;
import com.marklogic.client.admin.config.QueryOptions.Facets;
import com.marklogic.client.admin.config.QueryOptions.FragmentScope;
import com.marklogic.client.admin.config.QueryOptionsBuilder;
import com.marklogic.client.io.QueryOptionsHandle;
import com.marklogic.client.io.QueryOptionsListHandle;
import com.marklogic.client.query.QueryManager;

/**
 * "Database" class that handles admin level database settings
 * - Setting up the query options for example
 * 
 * @author lewisap
 *
 */
@SuppressWarnings({ "deprecation" })
@Component
public class AdminHelper extends HelperBase {
	
	public void clearQueryOptions() {
		QueryManager queryMgr = getClient().newQueryManager();
		QueryOptionsManager optMgr = getClient().newServerConfigManager().newQueryOptionsManager();
		QueryOptionsListHandle listHandle = new QueryOptionsListHandle();

		queryMgr.optionsList(listHandle);
		
		for (Map.Entry<String,String> optionsSet : listHandle.getValuesMap().entrySet()) {
			if (!optionsSet.getKey().equalsIgnoreCase("default")) {
				optMgr.deleteOptions(optionsSet.getKey());
			}
		}
		
		closeConnection();
	}
	
	/**
	 * Function to set the query options in the database.
	 * 
	 * TODO - lots of old test code in here, need to remove it / comment it out
	 */
	public void setQueryOptions() {
		QueryOptionsManager optMgr = getClient().newServerConfigManager().newQueryOptionsManager();
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
		
		// Facet for people against state and companyName
		optHandle = new QueryOptionsHandle().withValues(
				optBldr.values("name",
						optBldr.range(
								optBldr.jsonRangeIndex("name",
										optBldr.stringRangeType(QueryOptions.DEFAULT_COLLATION))))).withConstraints(
		        optBldr.constraint("companyName",
		                optBldr.range(
		                        optBldr.jsonRangeIndex(("companyName"),
		                                optBldr.stringRangeType(QueryOptions.DEFAULT_COLLATION)))),
                optBldr.constraint("geo",
						optBldr.geospatial(
								optBldr.elementPairGeospatialIndex(
										new QName("geo"), 
										new QName("lat"), 
										new QName("lng")))),
                optBldr.constraint("state",
		                optBldr.range(
		                        optBldr.jsonRangeIndex(("state"),
		                                optBldr.stringRangeType(QueryOptions.DEFAULT_COLLATION)))));
		optHandle.setReturnResults(false);
		optMgr.writeOptions("person-companyName-state-facet", optHandle);
		
		optHandle = new QueryOptionsHandle().withConstraints(
				optBldr.constraint("state",
						optBldr.range(
		                        optBldr.jsonRangeIndex(("state"),
		                                optBldr.stringRangeType(QueryOptions.DEFAULT_COLLATION)),
		                        Facets.FACETED,
		                        FragmentScope.DOCUMENTS,
		                        null,
		                        "frequency-order", "descending")),
				optBldr.constraint("companyName",
						optBldr.range(
		                        optBldr.jsonRangeIndex(("companyName"),
		                                optBldr.stringRangeType(QueryOptions.DEFAULT_COLLATION)),
		                        Facets.FACETED,
		                        FragmentScope.DOCUMENTS,
		                        null,
		                        "frequency-order", "descending")));
		
		optMgr.writeOptions("statesAndCompanies-facet", optHandle);
		
		// option to get all people based on Company Name
		optHandle = new QueryOptionsHandle().withConstraints(
				optBldr.constraint("companyName",
						optBldr.value(
								optBldr.jsonTermIndex("companyName"))));
				
		optMgr.writeOptions("peopleByCompany", optHandle);
		
		// option to get all people based on state
		optHandle = new QueryOptionsHandle().withConstraints(
				optBldr.constraint("state",
						optBldr.value(
								optBldr.jsonTermIndex("state"))));
				
		optMgr.writeOptions("peopleByState", optHandle);
		
		// option to get all people based on state and company name
		optHandle = new QueryOptionsHandle().withConstraints(
				optBldr.constraint("state",
						optBldr.value(
								optBldr.jsonTermIndex("state"))),
				optBldr.constraint("companyName",
						optBldr.value(
								optBldr.jsonTermIndex("companyName"))));
				
		optMgr.writeOptions("peopleByStateAndCompany", optHandle);

		optHandle = new QueryOptionsHandle().withConstraints(
				optBldr.constraint("name",
		                optBldr.range(
		                        optBldr.jsonRangeIndex(("name"),
		                                optBldr.stringRangeType(QueryOptions.DEFAULT_COLLATION)),
		                        Facets.FACETED,
		                        FragmentScope.DOCUMENTS,
		                        null,
		                        "frequency-order", "descending")),
				optBldr.constraint("geo",
						optBldr.geospatial(
								optBldr.elementPairGeospatialIndex(
										new QName("http://marklogic.com/xdmp/json/basic", "geo"), 
										new QName("http://marklogic.com/xdmp/json/basic", "lat"), 
										new QName("http://marklogic.com/xdmp/json/basic", "lng")))),
						optBldr.constraint("eq-name", 
								optBldr.elementQuery(new QName("name"))));
		
		optMgr.writeOptions("geospatial", optHandle);
		
		/*
		 * String opts = new StringoptBldr()
     			.append("<options xmlns=\"http://marklogic.com/appservices/search\">")
     			.append(    "<debug>true</debug>")
     			.append("</options>")
     			.toString();
			optsMgr.writeOptions("debug", new StringHandle(opts));
		 */
		
		closeConnection();
	}
}
