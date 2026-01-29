import ESGRecord from '../models/ESGRecord.js';
import { roundToDecimal, calculatePercentage } from '../utils/helpers.js';

/**
 * ESG Calculation Service
 * Handles aggregation and calculation of ESG metrics
 */
class ESGCalculationService {
  /**
   * Calculate total carbon emissions
   */
  calculateTotalEmissions(scope1, scope2, scope3) {
    return roundToDecimal((scope1 || 0) + (scope2 || 0) + (scope3 || 0), 2);
  }

  /**
   * Calculate waste recycling rate
   */
  calculateWasteRecyclingRate(wasteGenerated, wasteRecycled) {
    if (!wasteGenerated || wasteGenerated === 0) return 0;
    return calculatePercentage(wasteRecycled || 0, wasteGenerated, 2);
  }

  /**
   * Aggregate environmental metrics for multiple records
   */
  aggregateEnvironmentalMetrics(records) {
    if (!records || records.length === 0) {
      return {
        totalScope1Emissions: 0,
        totalScope2Emissions: 0,
        totalScope3Emissions: 0,
        totalCarbonEmissions: 0,
        averageRenewableEnergyPercentage: 0,
        totalEnergyConsumption: 0,
        totalWaterUsage: 0,
        wasteRecyclingRate: 0
      };
    }

    const totals = records.reduce((acc, record) => {
      const env = record.environmental || {};

      acc.scope1 += env.scope1Emissions || 0;
      acc.scope2 += env.scope2Emissions || 0;
      acc.scope3 += env.scope3Emissions || 0;
      acc.renewableEnergy += env.renewableEnergyPercentage || 0;
      acc.energyConsumption += env.energyConsumption || 0;
      acc.waterUsage += env.waterUsage || 0;
      acc.wasteGenerated += env.wasteGenerated || 0;
      acc.wasteRecycled += env.wasteRecycled || 0;

      return acc;
    }, {
      scope1: 0,
      scope2: 0,
      scope3: 0,
      renewableEnergy: 0,
      energyConsumption: 0,
      waterUsage: 0,
      wasteGenerated: 0,
      wasteRecycled: 0
    });

    const totalCarbon = this.calculateTotalEmissions(
      totals.scope1,
      totals.scope2,
      totals.scope3
    );

    const avgRenewable = roundToDecimal(
      totals.renewableEnergy / records.length,
      2
    );

    const recyclingRate = this.calculateWasteRecyclingRate(
      totals.wasteGenerated,
      totals.wasteRecycled
    );

    return {
      totalScope1Emissions: roundToDecimal(totals.scope1, 2),
      totalScope2Emissions: roundToDecimal(totals.scope2, 2),
      totalScope3Emissions: roundToDecimal(totals.scope3, 2),
      totalCarbonEmissions: totalCarbon,
      averageRenewableEnergyPercentage: avgRenewable,
      totalEnergyConsumption: roundToDecimal(totals.energyConsumption, 2),
      totalWaterUsage: roundToDecimal(totals.waterUsage, 2),
      wasteRecyclingRate: recyclingRate
    };
  }

  /**
   * Aggregate social metrics
   */
  aggregateSocialMetrics(records) {
    if (!records || records.length === 0) {
      return {
        averageDiversityRatio: 0,
        totalHealthAndSafetyIncidents: 0,
        averageTrainingHours: 0,
        averageTurnoverRate: 0,
        totalCommunityInvestment: 0,
        averageFemaleEmployeesPercentage: 0
      };
    }

    const totals = records.reduce((acc, record) => {
      const social = record.social || {};

      acc.diversityRatio += social.diversityRatio || 0;
      acc.healthIncidents += social.healthAndSafetyIncidents || 0;
      acc.trainingHours += social.trainingHoursPerEmployee || 0;
      acc.turnoverRate += social.employeeTurnoverRate || 0;
      acc.communityInvestment += social.communityInvestment || 0;
      acc.femalePercentage += social.femaleEmployeesPercentage || 0;

      return acc;
    }, {
      diversityRatio: 0,
      healthIncidents: 0,
      trainingHours: 0,
      turnoverRate: 0,
      communityInvestment: 0,
      femalePercentage: 0
    });

    return {
      averageDiversityRatio: roundToDecimal(totals.diversityRatio / records.length, 2),
      totalHealthAndSafetyIncidents: totals.healthIncidents,
      averageTrainingHours: roundToDecimal(totals.trainingHours / records.length, 2),
      averageTurnoverRate: roundToDecimal(totals.turnoverRate / records.length, 2),
      totalCommunityInvestment: roundToDecimal(totals.communityInvestment, 2),
      averageFemaleEmployeesPercentage: roundToDecimal(totals.femalePercentage / records.length, 2)
    };
  }

  /**
   * Aggregate governance metrics
   */
  aggregateGovernanceMetrics(records) {
    if (!records || records.length === 0) {
      return {
        averageBoardIndependence: 0,
        complianceRate: 0,
        totalWhistleblowerCases: 0,
        totalDataBreaches: 0,
        averageFemaleDirectorsPercentage: 0
      };
    }

    const totals = records.reduce((acc, record) => {
      const gov = record.governance || {};

      acc.boardIndependence += gov.boardIndependence || 0;
      acc.compliant += gov.complianceStatus === 'compliant' ? 1 : 0;
      acc.whistleblower += gov.whistleblowerCases || 0;
      acc.dataBreaches += gov.dataBreaches || 0;
      acc.femaleDirectors += gov.femaleDirectorsPercentage || 0;

      return acc;
    }, {
      boardIndependence: 0,
      compliant: 0,
      whistleblower: 0,
      dataBreaches: 0,
      femaleDirectors: 0
    });

    const complianceRate = calculatePercentage(
      totals.compliant,
      records.length,
      2
    );

    return {
      averageBoardIndependence: roundToDecimal(totals.boardIndependence / records.length, 2),
      complianceRate,
      totalWhistleblowerCases: totals.whistleblower,
      totalDataBreaches: totals.dataBreaches,
      averageFemaleDirectorsPercentage: roundToDecimal(totals.femaleDirectors / records.length, 2)
    };
  }

  /**
   * Get ESG records for a specific period
   */
  async getRecordsForPeriod(organization, startDate, endDate) {
    try {
      return await ESGRecord.find({
        organization,
        status: 'approved',
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }).lean();
    } catch (error) {
      console.error('Error fetching ESG records:', error);
      throw error;
    }
  }

  /**
   * Calculate overall ESG scores
   */
  calculateOverallScores(environmentalSummary, socialSummary, governanceSummary) {
    const environmentalScore = Math.min(
      100,
      Math.max(0, 100 - (environmentalSummary.totalCarbonEmissions / 10000) * 100)
    );

    const socialScore = Math.min(
      100,
      Math.max(
        0,
        (
          socialSummary.averageDiversityRatio +
          (100 - socialSummary.totalHealthAndSafetyIncidents) +
          socialSummary.averageTrainingHours
        ) / 3
      )
    );

    const governanceScore = Math.min(
      100,
      Math.max(
        0,
        (
          governanceSummary.averageBoardIndependence +
          governanceSummary.complianceRate +
          (100 - governanceSummary.totalDataBreaches * 10)
        ) / 3
      )
    );

    const totalScore = (environmentalScore + socialScore + governanceScore) / 3;

    return {
      environmentalScore: roundToDecimal(environmentalScore, 2),
      socialScore: roundToDecimal(socialScore, 2),
      governanceScore: roundToDecimal(governanceScore, 2),
      totalScore: roundToDecimal(totalScore, 2)
    };
  }
}

export default new ESGCalculationService();
