package com.researchsystem.backend.service.impl;

import com.researchsystem.backend.domain.enums.*;
import com.researchsystem.backend.dto.response.ReferenceEnumsResponse;
import com.researchsystem.backend.service.ReferenceDataService;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReferenceDataServiceImpl implements ReferenceDataService {

    @Override
    public ReferenceEnumsResponse getAllEnums() {
        Map<String, List<String>> map = new LinkedHashMap<>();
        map.put("topicStatus", names(TopicStatus.values()));
        map.put("councilRole", names(CouncilRole.values()));
        map.put("researchType", names(ResearchType.values()));
        map.put("finalDecision", names(FinalDecision.values()));
        map.put("submissionStatus", names(SubmissionStatus.values()));
        map.put("systemRole", names(SystemRole.values()));
        return ReferenceEnumsResponse.builder().enums(map).build();
    }

    private static <E extends Enum<E>> List<String> names(E[] values) {
        return Arrays.stream(values).map(Enum::name).toList();
    }
}
