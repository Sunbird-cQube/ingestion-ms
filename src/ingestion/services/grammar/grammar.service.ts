import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class GrammarService {
    constructor(private _databaseService: DatabaseService) {
    }

    async getEventSchemas() {
        return await this._databaseService.executeQuery(`select id, name, schema from spec."EventGrammar" WHERE "eventType"='EXTERNAL'`);
    }

    async getDimensionSchemas() {
        return await this._databaseService.executeQuery(`select id, name, schema from spec."DimensionGrammar" WHERE "dimensionType"='EXTERNAL'`);
    }

    async getEventSchemaByID(id) {
        return await this._databaseService.executeQuery(`select id, name, schema from spec."EventGrammar" where id = $1`, [id]);
    }

    async getDimensionSchemaByID(id) {
        return await this._databaseService.executeQuery(`select id, name, schema from spec."DimensionGrammar" where id = $1`, [id]);
    }
}
